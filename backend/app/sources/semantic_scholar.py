import logging

import httpx

from app.config import settings
from app.sources.base import BasePaperSource, PaperResult

logger = logging.getLogger(__name__)

SEMANTIC_SCHOLAR_FIELDS_OF_STUDY = [
    "Computer Science",
    "Mathematics",
    "Physics",
    "Biology",
    "Medicine",
    "Chemistry",
    "Engineering",
    "Environmental Science",
    "Geography",
    "Geology",
    "Materials Science",
    "Psychology",
    "Sociology",
    "Economics",
    "Business",
    "Political Science",
    "Philosophy",
    "Art",
    "History",
    "Linguistics",
    "Education",
    "Law",
    "Agricultural and Food Sciences",
]


class SemanticScholarSource(BasePaperSource):
    name = "Semantic Scholar"

    async def get_available_domains(self) -> list[str] | None:
        return SEMANTIC_SCHOLAR_FIELDS_OF_STUDY

    async def search_papers(self, domain: str, max_results: int = 20) -> list[PaperResult]:
        url = f"{settings.semantic_scholar_base_url}/paper/search"
        params = {
            "query": domain,
            "limit": min(max_results, 100),
            "fields": (
                "title,authors,abstract,year,venue,externalIds,"
                "url,openAccessPdf,citationCount,fieldsOfStudy,"
                "publicationDate"
            ),
            "sort": "publicationDate:desc",
        }

        papers = []
        try:
            async with httpx.AsyncClient(timeout=settings.request_timeout) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()

                for item in data.get("data", []):
                    if not item.get("title"):
                        continue

                    authors = [
                        a.get("name", "Unknown")
                        for a in (item.get("authors") or [])
                    ]

                    external_ids = item.get("externalIds") or {}
                    doi = external_ids.get("DOI", "")
                    arxiv_id = external_ids.get("ArXiv", "")

                    external_link = item.get("url", "")
                    if not external_link and doi:
                        external_link = f"https://doi.org/{doi}"

                    pdf_link = ""
                    open_access_pdf = item.get("openAccessPdf")
                    if open_access_pdf and open_access_pdf.get("url"):
                        pdf_link = open_access_pdf["url"]
                    elif arxiv_id:
                        pdf_link = f"https://arxiv.org/pdf/{arxiv_id}.pdf"

                    is_open_access = bool(pdf_link)

                    fields = item.get("fieldsOfStudy") or []
                    domain_tags = fields if fields else [domain]

                    paper_id = item.get("paperId", "")
                    source_id = f"s2:{paper_id}" if paper_id else f"s2:{item['title'][:100]}"

                    pub_date = item.get("publicationDate") or ""
                    if not pub_date and item.get("year"):
                        pub_date = str(item["year"])

                    papers.append(PaperResult(
                        title=item["title"],
                        authors=authors,
                        abstract=item.get("abstract") or "",
                        pub_date=pub_date,
                        source="Semantic Scholar",
                        venue=item.get("venue") or "",
                        external_link=external_link,
                        pdf_link=pdf_link,
                        citation_count=item.get("citationCount") or 0,
                        is_open_access=is_open_access,
                        domain_tags=domain_tags,
                        source_id=source_id,
                    ))

        except Exception as e:
            logger.error(f"Semantic Scholar search failed for '{domain}': {e}")
            raise

        return papers
