"""Render a saved case as a PDF a lawyer can carry to the lectern.

Mirrors ``docx_builder`` section-for-section, but renders with reportlab (pure Python,
no system libraries) so the export needs nothing extra in the container image.
"""

import io
import re
from xml.sax.saxutils import escape

from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
)

from app.export.docx_builder import DISCLAIMER
from app.models.schemas import Argument, CaseAnalysis, CitedFact


def _styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "PHTitle", parent=base["Title"], fontSize=20, spaceAfter=10, alignment=TA_LEFT
        ),
        "disclaimer": ParagraphStyle(
            "PHDisclaimer",
            parent=base["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=8.5,
            textColor="#8a6d1b",
            spaceAfter=14,
            leading=12,
        ),
        "h1": ParagraphStyle(
            "PHH1", parent=base["Heading1"], fontSize=14, spaceBefore=16, spaceAfter=6
        ),
        "h2": ParagraphStyle(
            "PHH2", parent=base["Heading2"], fontSize=11.5, spaceBefore=10, spaceAfter=4
        ),
        "body": ParagraphStyle(
            "PHBody", parent=base["Normal"], fontSize=10, leading=14, spaceAfter=4
        ),
        "bullet": ParagraphStyle(
            "PHBullet", parent=base["Normal"], fontSize=10, leading=14
        ),
    }


def _p(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(escape(text), style)


def _fact_markup(fact: CitedFact) -> str:
    text = escape(fact.text)
    citations = "; ".join(f"{c.source_document}, {c.location}" for c in fact.citations)
    if citations:
        text += f'  <i><font size="8">[{escape(citations)}]</font></i>'
    return text


def _bulleted(items: list[str], style: ParagraphStyle) -> ListFlowable:
    return ListFlowable(
        [ListItem(Paragraph(item, style), leftIndent=12) for item in items],
        bulletType="bullet",
        start="•",
        leftIndent=14,
    )


def _argument_flowables(index: int, argument: Argument, styles: dict) -> list:
    flow: list = [_p(f"{index}. {argument.point}", styles["h2"])]

    if argument.legal_basis:
        flow.append(_p(f"Legal basis: {argument.legal_basis}", styles["body"]))

    if argument.supporting_facts:
        flow.append(_p("Supporting facts:", styles["body"]))
        flow.append(_bulleted([_fact_markup(f) for f in argument.supporting_facts], styles["bullet"]))

    if argument.authorities:
        flow.append(_p("Authorities:", styles["body"]))
        lines = []
        for authority in argument.authorities:
            parts = [authority.title]
            if authority.court:
                parts.append(authority.court)
            if authority.date:
                parts.append(authority.date)
            line = escape(" — ".join(parts))
            if authority.url:
                line += f'  <i><font size="8">{escape(authority.url)}</font></i>'
            lines.append(line)
        flow.append(_bulleted(lines, styles["bullet"]))

    if argument.counter_argument:
        flow.append(_p(f"Anticipated counter-argument: {argument.counter_argument}", styles["body"]))
    if argument.rebuttal:
        flow.append(_p(f"Rebuttal: {argument.rebuttal}", styles["body"]))

    return flow


def build_hearing_pack_pdf(title: str, analysis: CaseAnalysis) -> bytes:
    styles = _styles()
    story: list = [_p(title, styles["title"]), _p(DISCLAIMER, styles["disclaimer"])]

    prep = analysis.hearing_prep

    story.append(_p("Hearing Brief", styles["h1"]))
    story.append(_p(prep.brief if prep else "The Prepare pack could not be generated.", styles["body"]))

    if prep and prep.outline:
        story.append(_p("Oral Argument Outline", styles["h1"]))
        for section in prep.outline:
            story.append(_p(section.heading, styles["h2"]))
            if section.talking_points:
                story.append(_bulleted([escape(pt) for pt in section.talking_points], styles["bullet"]))

    story.append(_p("Arguments", styles["h1"]))
    if not analysis.arguments:
        story.append(_p("No arguments were generated.", styles["body"]))
    for index, argument in enumerate(analysis.arguments, start=1):
        story.extend(_argument_flowables(index, argument, styles))

    if prep and prep.checklist:
        story.append(_p("Checklist", styles["h1"]))
        story.append(
            _bulleted(
                [f"({escape(e.category)}) {escape(e.item)}" for e in prep.checklist],
                styles["bullet"],
            )
        )

    if analysis.warnings:
        story.append(_p("Warnings from this run", styles["h1"]))
        story.append(_bulleted([escape(w) for w in analysis.warnings], styles["bullet"]))

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=LETTER,
        leftMargin=0.9 * inch,
        rightMargin=0.9 * inch,
        topMargin=0.9 * inch,
        bottomMargin=0.9 * inch,
        title=title,
    )
    doc.build(story + [Spacer(1, 1)])
    return buffer.getvalue()


def export_filename_pdf(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return f"{slug or 'hearing-pack'}.pdf"
