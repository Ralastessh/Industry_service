from langchain_community.document_loaders import PyPDFLoader

def load_pdf_text(pdf_path: str) -> str:
    loader = PyPDFLoader(pdf_path)
    pages = loader.load()
    return "\n".join([p.page_content for p in pages])