"""Services for the Quotable integration."""

from functools import partial
from http import HTTPStatus
import logging

import aiohttp

from homeassistant.core import (
    HomeAssistant,
    ServiceCall,
    ServiceResponse,
    SupportsResponse,
)
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import (
    ATTR_SELECTED_AUTHORS,
    ATTR_SELECTED_TAGS,
    ATTR_UPDATE_FREQUENCY,
    DOMAIN,
    FETCH_A_QUOTE_URL,
    GET_TAGS_URL,
    HTTP_CLIENT_TIMEOUT,
    SERVICE_FETCH_A_QUOTE,
    SERVICE_FETCH_ALL_TAGS,
    SERVICE_SEARCH_AUTHORS,
    SERVICE_UPDATE_CONFIGURATION,
)

_LOGGER = logging.getLogger(__name__)


def register_services(hass: HomeAssistant) -> None:
    """Register services for the Quotable component."""

    session = async_get_clientsession(hass)

    hass.services.async_register(
        domain=DOMAIN,
        service=SERVICE_FETCH_ALL_TAGS,
        service_func=partial(_fetch_all_tags_service, session),
        supports_response=SupportsResponse.ONLY,
    )

    hass.services.async_register(
        domain=DOMAIN,
        service=SERVICE_SEARCH_AUTHORS,
        service_func=partial(_search_authors_service, session),
    )

    hass.services.async_register(
        domain=DOMAIN,
        service=SERVICE_FETCH_A_QUOTE,
        service_func=partial(_fetch_a_quote_service, session, hass),
        supports_response=SupportsResponse.ONLY,
    )

    hass.services.register(
        domain=DOMAIN,
        service=SERVICE_UPDATE_CONFIGURATION,
        service_func=partial(_update_configuration_service, hass),
    )


async def _fetch_all_tags_service(
    session: aiohttp.ClientSession, service: ServiceCall
) -> ServiceResponse:
    response = await session.get(GET_TAGS_URL, timeout=HTTP_CLIENT_TIMEOUT)
    if response.status == HTTPStatus.OK:
        data = await response.json()
        if data:
            tags = {item["slug"]: item["name"] for item in data}
            return tags

    return None


async def _search_authors_service(
    session: aiohttp.ClientSession, service: ServiceCall
) -> None:
    pass


async def _fetch_a_quote_service(
    session: aiohttp.ClientSession, hass: HomeAssistant, service: ServiceCall
) -> ServiceResponse:
    """Get the Quotable instance from hass.data."""
    quotable = hass.data.get(DOMAIN)
    if quotable is None:
        return None

    selected_tags = quotable.config.get(ATTR_SELECTED_TAGS, [])
    selected_authors = quotable.config.get(ATTR_SELECTED_AUTHORS, [])

    tags_param = "".join(selected_tags).replace(",", "|")
    authors_param = "".join(selected_authors).replace(",", "|")

    url = f"{FETCH_A_QUOTE_URL}?tags={tags_param}&author={authors_param}&limit=1"

    response = await session.get(url, timeout=HTTP_CLIENT_TIMEOUT)

    if response.status == HTTPStatus.OK:
        data = await response.json()
        if data:
            quotes = {data["content"]: data["author"]}
            return quotes

    return None


def _update_configuration_service(hass: HomeAssistant, service: ServiceCall) -> None:
    if quotable := hass.data.get(DOMAIN):
        quotable.update_configuration(
            service.data[ATTR_SELECTED_TAGS],
            service.data[ATTR_SELECTED_AUTHORS],
            service.data[ATTR_UPDATE_FREQUENCY],
        )
