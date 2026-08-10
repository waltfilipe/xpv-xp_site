"""Unit tests for Transfermarkt profile/age parsing."""

from __future__ import annotations

import unittest

import transfermarkt_profiles as tm


SAMPLE_HTML = """
<span itemprop="birthDate" class="data-header__content"> 04/07/2001 (25) </span>
<span itemprop="height" class="data-header__content"> 5 ft 10 in </span>
<span itemprop="nationality" class="data-header__content"> Argentina </span>
<span>Foot:</span><span class="data-header__content"> right </span>
"""

SAMPLE_API_PAYLOAD = {
    "data": {
        "portraitUrl": "https://img.a.transfermarkt.technology/portrait/big/756990.jpg",
        "attributes": {
            "dateOfBirth": "2001-07-04",
            "age": 25,
            "height": 178,
            "citizenship": "Argentina",
            "foot": "right",
            "contractUntil": "2029-06-30",
        },
        "marketValueDetails": {
            "current": {
                "value": 25000000,
                "determined": "2026-05-29",
                "compact": {"prefix": "€", "content": "25.00", "suffix": "M"},
            }
        },
    }
}


class TransfermarktProfileTests(unittest.TestCase):
    def test_parse_birth_text_dd_mm_yyyy(self) -> None:
        dob, age = tm.parse_transfermarkt_birth_text("04/07/2001 (25)")
        self.assertEqual(dob, "2001-07-04")
        self.assertEqual(age, 25)

    def test_parse_birth_text_iso(self) -> None:
        dob, age = tm.parse_transfermarkt_birth_text("2001-07-04")
        self.assertEqual(dob, "2001-07-04")
        self.assertIsNotNone(age)

    def test_profile_fields_from_api_payload(self) -> None:
        fields = tm.transfermarkt_fields_from_player_payload(SAMPLE_API_PAYLOAD)
        self.assertEqual(fields["date_of_birth"], "2001-07-04")
        self.assertEqual(fields["age"], 25)
        self.assertEqual(fields["nationality"], "Argentina")
        self.assertEqual(fields["dominant_foot"], "Right")
        self.assertEqual(fields["market_value_eur"], 25000000)

    def test_profile_fields_from_html(self) -> None:
        fields = tm.transfermarkt_fields_from_html(SAMPLE_HTML)
        self.assertEqual(fields["date_of_birth"], "2001-07-04")
        self.assertEqual(fields["age"], 25)
        self.assertEqual(fields["nationality"], "Argentina")
        self.assertEqual(fields["dominant_foot"], "Right")
        self.assertIn("height", fields)

    def test_tm_profile_slug(self) -> None:
        self.assertEqual(tm.transfermarkt_profile_slug("Alan Varela"), "alan-varela")
        self.assertEqual(tm.transfermarkt_profile_slug("Ömer Faruk Gümüş"), "omer-faruk-gumus")


if __name__ == "__main__":
    unittest.main()
