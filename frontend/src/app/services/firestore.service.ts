import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, catchError } from 'rxjs';

export const FIREBASE_CONFIG = {
  projectId: 'mmar-store',
  apiKey: 'AIzaSyDcIyMtVbSHKl8XAVuCtmIcu1-zaCiK8Eo'
};

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

export function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: val.toString() } : { doubleValue: val };
  }
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields: any = {};
    for (const k of Object.keys(val)) {
      fields[k] = toFirestoreValue(val[k]);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

export function fromFirestoreValue(val: any): any {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('arrayValue' in val) {
    return (val.arrayValue.values || []).map(fromFirestoreValue);
  }
  if ('mapValue' in val) {
    const res: any = {};
    const fields = val.mapValue.fields || {};
    for (const k of Object.keys(fields)) {
      res[k] = fromFirestoreValue(fields[k]);
    }
    return res;
  }
  if ('nullValue' in val) return null;
  return null;
}

export function docToItem<T = any>(doc: any): T {
  const result: any = {};
  if (doc.name) {
    const parts = doc.name.split('/');
    result.id = parts[parts.length - 1];
  }
  const fields = doc.fields || {};
  for (const k of Object.keys(fields)) {
    result[k] = fromFirestoreValue(fields[k]);
  }
  return result as T;
}

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  constructor(private http: HttpClient) {}

  private getUrl(collection: string, docId?: string): string {
    const path = docId ? `${collection}/${docId}` : collection;
    return `${FIRESTORE_BASE}/${path}?key=${FIREBASE_CONFIG.apiKey}`;
  }

  getCollection<T = any>(collection: string): Observable<T[]> {
    return this.http.get<{ documents?: any[] }>(this.getUrl(collection)).pipe(
      map(res => (res.documents || []).map(d => docToItem<T>(d))),
      catchError(err => {
        console.warn(`Firestore getCollection (${collection}) error:`, err);
        return of([]);
      })
    );
  }

  getDocument<T = any>(collection: string, docId: string): Observable<T | null> {
    return this.http.get<any>(this.getUrl(collection, docId)).pipe(
      map(d => docToItem<T>(d)),
      catchError(() => of(null))
    );
  }

  setDocument(collection: string, docId: string, data: any): Observable<any> {
    const fields: any = {};
    for (const k of Object.keys(data)) {
      if (k !== 'id') {
        fields[k] = toFirestoreValue(data[k]);
      }
    }
    return this.http.patch(this.getUrl(collection, docId), { fields });
  }

  createDocument(collection: string, data: any, customId?: string): Observable<any> {
    const docId = customId || (data.id ? String(data.id) : `doc_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
    return this.setDocument(collection, docId, { ...data, id: docId });
  }

  deleteDocument(collection: string, docId: string): Observable<void> {
    return this.http.delete<void>(this.getUrl(collection, docId));
  }
}
