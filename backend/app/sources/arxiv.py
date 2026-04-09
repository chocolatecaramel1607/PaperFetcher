import logging
from urllib.parse import quote

import httpx
import xmltodict

from app.config import settings
from app.sources.base import BasePaperSource, PaperResult

logger = logging.getLogger(__name__)


class ArxivSource(BasePaperSource):
    name = "arXiv"

    async def get_available_domains(self) -> list[str] | None:
        return None

    async def search_papers(self, domain: str, max_results: int = 20) -> list[PaperResult]:
        url = f"{settings.arxiv_base_url}/query"
        params = {
            "search_query": f"all:{quote(domain)}",
            "start": 0,
            "max_results": max_results,
            "sortBy": "submittedDate",
            "sortOrder": "descending",
        }

        papers = []
        try:
            async with httpx.AsyncClient(timeout=settings.request_timeout) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = xmltodict.parse(response.text)

                feed = data.get("feed", {})
                entries = feed.get("entry", [])
                if isinstance(entries, dict):
                    entries = [entries]

                for entry in entries:
                    title = entry.get("title", "").replace("\n", " ").strip()
                    if not title:
                        continue

                    authors_raw = entry.get("author", [])
                    if isinstance(authors_raw, dict):
                        authors_raw = [authors_raw]
                    authors = [a.get("name", "Unknown") for a in authors_raw]

                    abstract = entry.get("summary", "").replace("\n", " ").strip()
                    published = entry.get("published", "")
                    pub_date = published[:10] if published else ""

                    arxiv_id = entry.get("id", "")
                    if arxiv_id:
                        # Extract ID from URL like http://arxiv.org/abs/2301.12345v1
                        parts = arxiv_id.split("/abs/")
                        short_id = parts[-1] if len(parts) > 1 else arxiv_id
                    else:
                        short_id = title[:100]

                    external_link = arxiv_id
                    pdf_link = arxiv_id.replace("/abs/", "/pdf/") if "/abs/" in arxiv_id else ""

                    links = entry.get("link", [])
                    if isinstance(links, dict):
                        links = [links]
                    for link in links:
                        if link.get("@title") == "pdf":
                            pdf_link = link.get("@href", pdf_link)

                    # Get categories
                    categories = entry.get("category", [])
                    if isinstance(categories, dict):
                        categories = [categories]
                    domain_tags = [c.get("@term", "") for c in categories if c.get("@term")]
                    if not domain_tags:
                        domain_tags = [domain]

                    papers.append(PaperResult(
                        title=title,
                        authors=authors,
                        abstract=abstract,
                        pub_date=pub_date,
                        source="arXiv",
                        venue="arXiv",
                        external_link=external_link,
                        pdf_link=pdf_link,
                        citation_count=0,
                        is_open_access=True,
                        domain_tags=domain_tags,
                        source_id=f"arxiv:{short_id}",
                    ))

        except Exception as e:
            logger.error(f"arXiv search failed for '{domain}': {e}")
            raise

        return papers
