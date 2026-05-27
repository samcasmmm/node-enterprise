import { type Request, type Response } from 'express';
import { type BooksService } from './books.service.js';

export class BooksController {
  constructor(private readonly service: BooksService) {}

  /**
   * Action handler to fetch dynamic book records.
   */
  public list = async (req: Request, res: Response): Promise<void> => {
    try {
      const activeBooks = await this.service.listBooks(req.db);
      res.build
        .withStatus(200)
        .success()
        .withMessage('Books fetched successfully')
        .withData({
          tenantId: req.tenantId,
          database: req.tenant?.databaseName,
          books: activeBooks,
        })
        .send();
    } catch (error: any) {
      console.error('❌ BooksController list Exception:', error);
      res.build
        .withStatus(500)
        .fail()
        .withMessage(error.message || 'Database query operation failed on dynamic tenant DB.')
        .withError('DATABASE_ERROR', error.message)
        .send();
    }
  };

  /**
   * Action handler to insert a new book record inside the tenant's dynamic DB catalog.
   */
  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      const book = await this.service.createBook(req.db, req.body);
      res.build
        .withStatus(201)
        .success()
        .withMessage('Book created successfully')
        .withData({
          tenantId: req.tenantId,
          database: req.tenant?.databaseName,
          book,
        })
        .send();
    } catch (error: any) {
      console.error('❌ BooksController create Exception:', error);
      res.build
        .withStatus(500)
        .fail()
        .withMessage(error.message || 'Database insert operation failed on dynamic tenant DB.')
        .withError('DATABASE_ERROR', error.message)
        .send();
    }
  };
}
