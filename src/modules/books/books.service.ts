import { books } from '@/shared/database/schemas/tenant.js';
import { type CreateBookDto } from './books.dto.js';
import { type BookRecord } from './books.types.js';

export class BooksService {
  constructor() {}

  /**
   * Fetches books catalog from the dynamic tenant's database connection.
   */
  public async listBooks(db: any): Promise<BookRecord[]> {
    return db.select().from(books);
  }

  /**
   * Inserts a new book record inside the dynamic tenant's database catalog.
   */
  public async createBook(db: any, dto: CreateBookDto): Promise<BookRecord> {
    const result = await db
      .insert(books)
      .values({
        title: dto.title,
        author: dto.author,
        price: String(dto.price),
      })
      .returning();

    return result[0];
  }
}
