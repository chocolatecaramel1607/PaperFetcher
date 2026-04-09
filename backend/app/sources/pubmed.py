import logging
from urllib.parse import quote

import httpx

from app.config import settings
from app.sources.base import BasePaperSource, PaperResult

logger = logging.getLogger(__name__)


class PubMedSource(BasePaperSource):
    name = "PubMed / Europe PMC"

    async def get_available_domains(self) -> list[str] | None:
        return None

    async def search_papers(self, domain: str, max_results: int = 20) -> list[PaperResult]:
        url = f"{settings.pubmed_base_url}/search"
        params = {
            "query": quote(domain),
            "resultType": "core",
            "pageSize": max_results,
            "sort": "DATE_CREATED desc",
            "format": "json",
        }

        papers = []
        try:
            async with httpx.AsyncClient(timeout=settings.request_timeout) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()

                results = data.get("resultList", {}).get("result", [])

                for item in results:
                    title = item.get("title", "").strip()
                    if not title:
                        continue

                    authors_list = item.get("authorList", {}).get("author", [])
                    authors = []
                    for a in authors_list:
                        full_name = a.get("fullName", "")
                        if not full_name:
                            first = a.get("firstName", "")
                            last = a.get("lastName", "")
                            full_name = f"{first} {last}".strip()
                        if full_name:
                            authors.append(full_name)

                    abstract = item.get("abstractText", "") or ""
                    pub_date = item.get("firstPublicationDate", "") or ""

                    source_name = item.get("source", "")
                    journal = item.get("journalTitle", source_name)

                    pmid = item.get("pmid", "")
                    pmcid = item.get("pmcid", "")
                    doi = item.get("doi", "")

                    external_link = ""
                    if doi:
                        external_link = f"https://doi.org/{doi}"
                    elif pmid:
                        external_link = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"

                    pdf_link = ""
                    is_open_access = item.get("isOpenAccess", "N") == "Y"
                    if is_open_access and pmcid:
                        pdf_link = (
                            f"https://europepmc.org/backend/ptpmcrender.fcgi"
                            f"?accid={pmcid}&blobtype=pdf"
                        )

                    if pmid:
                        source_id_val = f"pmid:{pmid}"
                    elif pmcid:
                        source_id_val = f"pmc:{pmcid}"
                    else:
                        source_id_val = f"pubmed:{title[:100]}"

                    papers.append(PaperResult(
                        title=title,
                        authors=authors,
                        abstract=abstract,
                        pub_date=pub_date,
                        source="PubMed / Europe PMC",
                        venue=journal,
                        external_link=external_link,
                        pdf_link=pdf_link,
                        citation_count=item.get("citedByCount", 0) or 0,
                        is_open_access=is_open_access,
                        domain_tags=[domain],
                        source_id=source_id_val,
                    ))

        except Exception as e:
            logger.error(f"PubMed search failed for '{domain}': {e}")
            raise

        return papers
