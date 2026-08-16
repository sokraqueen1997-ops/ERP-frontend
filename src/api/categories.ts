import { apiFetch } from './client';

export interface Category {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
}

export function fetchCategories() {
  return apiFetch<Category[]>('/categories');
}
