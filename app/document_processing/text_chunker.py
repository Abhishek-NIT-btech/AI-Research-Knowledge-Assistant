def chunk_pages(
    pages: list,
    chunk_size: int = 500,
    overlap: int = 100
):
    """
    Split every page into overlapping chunks while
    preserving the page number.

    Returns:
    [
        {
            "text": "...",
            "page": 1
        },
        ...
    ]
    """

    all_chunks = []

    for page in pages:

        page_number = page["page"]
        text = page["text"]

        start = 0

        while start < len(text):

            end = start + chunk_size

            chunk = text[start:end]

            if chunk.strip():

                all_chunks.append(
                    {
                        "text": chunk,
                        "page": page_number
                    }
                )

            start += chunk_size - overlap

    return all_chunks