import Book from "../models/Book";

export async function findBookById(bookId: string){
    const book = await Book.findById(bookId);
    return book;
}