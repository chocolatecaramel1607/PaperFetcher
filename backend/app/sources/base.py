import abc
from dataclasses import dataclass


@dataclass
class PaperResult:
    title: str
    authors: list[str]
    abstract: str
    pub_date: str
    source: str
    venue: str
    external_link: str
    pdf_link: str
    citation_count: int
    is_open_access: bool
    domain_tags: list[str]
    source_id: str


class BasePaperSource(abc.ABC):
    name: str = "base"

    @abc.abstractmethod
    async def search_papers(self, domain: str, max_results: int = 20) -> list[PaperResult]:
        pass

    @abc.abstractmethod
    async def get_available_domains(self) -> list[str] | None:
        """Return native domain list if available, else None."""
        pass
