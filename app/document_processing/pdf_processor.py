import fitz  # PyMuPDF


def extract_text_from_pdf(pdf_path: str):
    """
    Extract text page-by-page from a PDF.

    Returns:
        (
            full_text,
            total_pages,
            pages
        )

        pages example:
        [
            {
                "page": 1,
                "text": "..."
            },
            ...
        ]
    """

    document = fitz.open(pdf_path)

    total_pages = len(document)

    pages = []

    full_text = ""

    for page_number, page in enumerate(document, start=1):

        page_text = page.get_text()

        full_text += page_text

        pages.append(
            {
                "page": page_number,
                "text": page_text
            }
        )

    document.close()

    return full_text, total_pages, pages