"""Execute the published SHACL and compare aggregate decisions with Node.

Install tests/requirements-shacl.txt, then run npm run test:shacl. Missing
dependencies and SHACL engine failures are errors, never skipped tests.
"""

import copy
import json
from pathlib import Path
import subprocess
import unittest

from pyshacl import validate
from rdflib import Graph


ROOT = Path(__file__).resolve().parents[1]
PROFILE = ROOT / "docs/schema/earl/v0"
EXAMPLE = json.loads((PROFILE / "example.jsonld").read_text())
CONTEXT = json.loads((PROFILE / "context.jsonld").read_text())["@context"]
NAMES = ["N/A", "Perceiving", "Assessing", "Integrating", "Calibrating", "Engineering"]
NODE_VALIDATOR = """
let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => console.log(JSON.stringify(
  require('./scripts/validate.js').validateEarl(JSON.parse(input))
)));
"""


def report():
    return copy.deepcopy(EXAMPLE)


def exclude(assertion):
    assertion["inScope"] = False
    assertion["result"]["outcome"] = "earl:inapplicable"
    for key in ("level", "levelName", "source"):
        assertion["result"].pop(key, None)


def all_na():
    doc = report()
    for assertion in doc["assertion"]:
        exclude(assertion)
    for key in ("postureLevel", "postureLevelName", "constrainingVector"):
        doc.pop(key, None)
    return doc


def set_level(assertion, level):
    assertion["result"].update(level=level, levelName=NAMES[level])
    assertion["test"] = (
        f'https://aiposture.org/criteria/v1/{assertion["vector"].lower()}/{level}'
    )


class ShaclAggregateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.shapes = Graph().parse(PROFILE / "shapes.ttl", format="turtle")

    def data_graph(self, *docs):
        graph = Graph()
        for doc in docs:
            local = copy.deepcopy(doc)
            # Resolve only against the checked-in context, never the network.
            local["@context"] = CONTEXT
            graph.parse(data=json.dumps(local), format="json-ld")
        return graph

    def check_shacl(self, expected, *docs, meta_shacl=False):
        conforms, result, details = validate(
            self.data_graph(*docs), shacl_graph=self.shapes,
            advanced=True, meta_shacl=meta_shacl,
        )
        self.assertIsInstance(result, Graph, str(result))
        self.assertEqual(conforms, expected, details)

    def check(self, doc, expected):
        proc = subprocess.run(
            ["node", "-e", NODE_VALIDATOR], input=json.dumps(doc),
            cwd=ROOT, text=True, capture_output=True, check=True, timeout=15,
        )
        js = json.loads(proc.stdout)
        self.assertEqual(not js["errors"], expected, js["errors"])
        self.check_shacl(expected, doc)

    def test_meta_shacl_and_shipped_example(self):
        self.check_shacl(True, report(), meta_shacl=True)
        self.check(report(), True)

    def test_missing_in_scope_aggregate(self):
        doc = report()
        del doc["postureLevel"]
        self.check(doc, False)

    def test_wrong_minimum(self):
        doc = report()
        doc["postureLevel"] = 4
        self.check(doc, False)

    def test_missing_constraining_vector(self):
        doc = report()
        del doc["constrainingVector"]
        self.check(doc, False)

    def test_wrong_constraining_vector(self):
        doc = report()
        doc["constrainingVector"] = ["People"]
        self.check(doc, False)

    def test_all_na_with_asserted_aggregate(self):
        doc = all_na()
        doc.update(postureLevel=5, postureLevelName="Engineering", constrainingVector=["People"])
        self.check(doc, False)

    def test_all_na_with_level_only(self):
        doc = all_na()
        doc["postureLevel"] = 5
        self.check(doc, False)

    def test_all_na_with_maturity_name_only(self):
        doc = all_na()
        doc["postureLevelName"] = "Engineering"
        self.check(doc, False)

    def test_all_na_with_constraining_vector_only(self):
        doc = all_na()
        doc["constrainingVector"] = ["People"]
        self.check(doc, False)

    def test_valid_mixed_scope(self):
        doc = report()
        exclude(doc["assertion"][2])
        doc.update(postureLevel=3, postureLevelName="Integrating", constrainingVector=["Infrastructure"])
        self.check(doc, True)

    def test_valid_all_na(self):
        self.check(all_na(), True)

    def test_valid_all_na_null_level_and_empty_constraining_set(self):
        doc = all_na()
        doc.update(postureLevel=None, postureLevelName="N/A", constrainingVector=[])
        self.check(doc, True)

    def test_valid_tied_minimum(self):
        doc = report()
        set_level(doc["assertion"][0], 2)
        doc["constrainingVector"] = ["Regulation", "People"]
        self.check(doc, True)

    def test_missing_one_of_two_constraining_vectors(self):
        doc = report()
        set_level(doc["assertion"][0], 2)
        self.check(doc, False)

    def test_extra_constraining_vector(self):
        doc = report()
        doc["constrainingVector"] = ["Regulation", "People"]
        self.check(doc, False)

    def test_valid_names_at_every_aggregate_level(self):
        for level in range(1, 6):
            with self.subTest(level=level):
                doc = report()
                for assertion in doc["assertion"]:
                    set_level(assertion, level)
                doc.update(postureLevel=level, postureLevelName=NAMES[level],
                           constrainingVector=["Infrastructure", "People", "Regulation"])
                self.check(doc, True)

    def test_wrong_aggregate_name(self):
        doc = report()
        doc["postureLevelName"] = "Engineering"
        self.check(doc, False)

    def test_optional_aggregate_name_can_be_omitted(self):
        doc = report()
        del doc["postureLevelName"]
        self.check(doc, True)

    def test_repeated_assertion_does_not_duplicate_constraining_vector(self):
        doc = report()
        doc["assertion"].append(copy.deepcopy(doc["assertion"][2]))
        self.check(doc, True)

    def test_scalar_constraining_vector(self):
        doc = report()
        doc["constrainingVector"] = "Regulation"
        self.check(doc, True)

    def two_reports(self):
        first, second = report(), report()
        first["@id"] = "urn:example:report:first"
        second["@id"] = "urn:example:report:second"
        exclude(second["assertion"][2])
        second.update(postureLevel=3, postureLevelName="Integrating", constrainingVector=["Infrastructure"])
        return first, second

    def test_multiple_reports_compute_their_own_minimum(self):
        first, second = self.two_reports()
        self.check(first, True)
        self.check(second, True)
        self.check_shacl(True, first, second)

    def test_one_invalid_report_is_not_hidden_by_another(self):
        first, second = self.two_reports()
        second["postureLevel"] = 4
        self.check(second, False)
        self.check_shacl(False, first, second)

    def test_contradictory_scope_still_fails(self):
        doc = report()
        doc["assertion"][0]["inScope"] = False
        self.check(doc, False)

    def test_wrong_criterion_still_fails(self):
        doc = report()
        doc["assertion"][0]["test"] = "https://aiposture.org/criteria/v1/people/5"
        self.check(doc, False)

    def test_missing_evidence_still_fails(self):
        doc = report()
        del doc["assertion"][0]["result"]["source"]
        self.check(doc, False)

    def test_empty_evidence_still_fails(self):
        doc = report()
        doc["assertion"][0]["result"]["source"] = []
        self.check(doc, False)


if __name__ == "__main__":
    unittest.main(verbosity=2)
