import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CategoryItem {
  id: string;
  nameAr: string;
  nameEn: string;
  description: string;
  tag: string;
}

@Component({
  selector: 'app-category-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-bar.component.html',
  styleUrls: ['./category-bar.component.scss']
})
export class CategoryBarComponent {
  @Input() selectedCategory: string = 'IPhone';
  @Output() categoryChange = new EventEmitter<string>();

  categories: CategoryItem[] = [
    {
      id: 'IPhone',
      nameAr: 'أجهزة آيفون',
      nameEn: 'iPhone',
      description: 'أحدث هواتف Apple الأصلية بضمان شامل',
      tag: 'Apple Official'
    },
    {
      id: 'Android',
      nameAr: 'أجهزة أندرويد',
      nameEn: 'Android',
      description: 'وحوش الأندرويد من Samsung, Xiaomi, Pixel',
      tag: 'Flagship Devices'
    },
    {
      id: 'Accessories',
      nameAr: 'إكسسوارات',
      nameEn: 'Accessories',
      description: 'سماعات، شواحن سريعة، كفرات حماية ومكبرات صوت',
      tag: 'Original Gear'
    },
    {
      id: 'Other',
      nameAr: 'أجهزة أخرى',
      nameEn: 'Other',
      description: 'ساعات ذكية، أجهزة آيباد وتابلت ومنتجات تقنية مميزة',
      tag: 'Smart Gadgets'
    }
  ];

  selectCategory(id: string): void {
    this.selectedCategory = id;
    this.categoryChange.emit(id);
  }
}
