import requests
import xml.etree.ElementTree as ET

ARXIV_API_URL = "http://export.arxiv.org/api/query"

def fetch_from_arxiv(query: str, max_results: int = 5):
    params = {
        "search_query": query,
        "start": 0,
        "max_results": max_results
    }
    response = requests.get(ARXIV_API_URL, params=params)
    response.raise_for_status()

    root = ET.fromstring(response.text)
    ns = {"atom": "http://www.w3.org/2005/Atom"}

    papers = []
    for entry in root.findall("atom:entry", ns):
        title = entry.find("atom:title", ns).text.strip()
        authors = ", ".join([a.find("atom:name", ns).text for a in entry.findall("atom:author", ns)])
        abstract = entry.find("atom:summary", ns).text.strip()
        link = entry.find("atom:id", ns).text
        published = entry.find("atom:published", ns).text

        papers.append({
            "title": title,
            "authors": authors,
            "abstract": abstract,
            "link": link,
            "published": published
        })

    return papers
