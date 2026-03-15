# File: backend/app/agents/report_generator.py
# Feature 11: Final Report Generator

from typing import Dict, Any, List
import os
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    Image as RLImage, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas
from app.utils.logger import logger
import json


class ReportGenerator:
    """Final Report Generator - Creates professional PDF reports"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
        logger.info("📄 Report Generator initialized")
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles."""
        self.styles.add(ParagraphStyle(
            name='CustomTitle', parent=self.styles['Heading1'],
            fontSize=24, textColor=colors.HexColor('#636B2F'),
            spaceAfter=30, alignment=TA_CENTER, fontName='Helvetica-Bold'
        ))
        self.styles.add(ParagraphStyle(
            name='SectionHeading', parent=self.styles['Heading2'],
            fontSize=16, textColor=colors.HexColor('#3D4127'),
            spaceBefore=20, spaceAfter=12, fontName='Helvetica-Bold'
        ))
        self.styles.add(ParagraphStyle(
            name='SubsectionHeading', parent=self.styles['Heading3'],
            fontSize=12, textColor=colors.HexColor('#636B2F'),
            spaceBefore=12, spaceAfter=6, fontName='Helvetica-Bold'
        ))
        self.styles.add(ParagraphStyle(
            name='BodyText', parent=self.styles['Normal'],
            fontSize=10, leading=14, alignment=TA_JUSTIFY,
            spaceBefore=6, spaceAfter=6
        ))
        self.styles.add(ParagraphStyle(
            name='Bullet', parent=self.styles['Normal'],
            fontSize=10, leftIndent=20, bulletIndent=10,
            spaceBefore=3, spaceAfter=3
        ))
    
    def generate_final_report(self, idea: Any, market_validation: Dict[str, Any],
                             competitor_analysis: Dict[str, Any],
                             quality_evaluation: Dict[str, Any] = None,
                             output_path: str = None) -> str:
        """Generate complete final report as PDF."""
        logger.info("=" * 70)
        logger.info("📄 GENERATING FINAL REPORT")
        logger.info("=" * 70)
        
        if not output_path:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = f"/mnt/user-data/outputs/Final_Report_{timestamp}.pdf"
        
        doc = SimpleDocTemplate(output_path, pagesize=letter,
                              rightMargin=72, leftMargin=72,
                              topMargin=72, bottomMargin=18)
        
        story = []
        story.extend(self._build_cover_page(idea))
        story.append(PageBreak())
        story.extend(self._build_executive_summary(idea, market_validation, competitor_analysis, quality_evaluation))
        story.append(PageBreak())
        story.extend(self._build_table_of_contents())
        story.append(PageBreak())
        story.extend(self._build_startup_overview(idea))
        story.append(PageBreak())
        story.extend(self._build_market_validation_section(market_validation))
        story.append(PageBreak())
        story.extend(self._build_competitor_section(competitor_analysis))
        story.append(PageBreak())
        if quality_evaluation:
            story.extend(self._build_quality_section(quality_evaluation))
            story.append(PageBreak())
        story.extend(self._build_recommendations_section(market_validation, competitor_analysis))
        story.append(PageBreak())
        story.extend(self._build_next_steps())
        
        doc.build(story, onFirstPage=self._add_page_number, onLaterPages=self._add_page_number)
        logger.info(f"✅ Report generated: {output_path}")
        return output_path
    
    def _build_cover_page(self, idea: Any) -> List:
        story = []
        story.append(Spacer(1, 2 * inch))
        title = getattr(idea, 'problem_statement', 'Startup Validation Report')[:100]
        story.append(Paragraph(title, self.styles['CustomTitle']))
        story.append(Spacer(1, 0.5 * inch))
        story.append(Paragraph("Complete Market Validation & Competitive Analysis", self.styles['Heading2']))
        story.append(Spacer(1, 1 * inch))
        story.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y')}", self.styles['Normal']))
        story.append(Spacer(1, 2 * inch))
        story.append(Paragraph("Powered by Foundry - AI Startup Validation Platform", self.styles['Normal']))
        return story
    
    def _build_executive_summary(self, idea, market_validation, competitor_analysis, quality_evaluation) -> List:
        story = []
        story.append(Paragraph("Executive Summary", self.styles['CustomTitle']))
        story.append(Spacer(1, 0.3 * inch))
        problem = getattr(idea, 'problem_statement', 'N/A')
        solution = getattr(idea, 'solution_description', 'N/A')
        story.append(Paragraph(f"<b>Problem:</b> {problem}", self.styles['BodyText']))
        story.append(Paragraph(f"<b>Solution:</b> {solution}", self.styles['BodyText']))
        story.append(Spacer(1, 0.2 * inch))
        story.append(Paragraph("Key Findings", self.styles['SectionHeading']))
        market_size = market_validation.get('market_size', {})
        tam = market_size.get('total_addressable_market', 'N/A')
        sam = market_size.get('serviceable_addressable_market', 'N/A')
        metrics_data = [
            ['Metric', 'Value'],
            ['Total Addressable Market (TAM)', str(tam)],
            ['Serviceable Addressable Market (SAM)', str(sam)],
            ['Competitors Analyzed', str(len(competitor_analysis.get('competitor_comparison', [])))],
        ]
        if quality_evaluation:
            avg_score = quality_evaluation.get('average_score', 'N/A')
            metrics_data.append(['Quality Score', f"{avg_score}/10"])
        table = Table(metrics_data, colWidths=[3 * inch, 3 * inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#636B2F')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(table)
        return story
    
    def _build_table_of_contents(self) -> List:
        story = []
        story.append(Paragraph("Table of Contents", self.styles['CustomTitle']))
        story.append(Spacer(1, 0.2 * inch))
        sections = ["1. Startup Overview", "2. Market Validation", "3. Competitive Analysis",
                   "4. Quality Assessment", "5. Strategic Recommendations", "6. Next Steps"]
        for section in sections:
            story.append(Paragraph(section, self.styles['Bullet']))
        return story
    
    def _build_startup_overview(self, idea: Any) -> List:
        story = []
        story.append(Paragraph("1. Startup Overview", self.styles['CustomTitle']))
        story.append(Spacer(1, 0.2 * inch))
        story.append(Paragraph("Problem Statement", self.styles['SectionHeading']))
        problem = getattr(idea, 'problem_statement', 'Not specified')
        story.append(Paragraph(problem, self.styles['BodyText']))
        story.append(Spacer(1, 0.2 * inch))
        story.append(Paragraph("Proposed Solution", self.styles['SectionHeading']))
        solution = getattr(idea, 'solution_description', 'Not specified')
        story.append(Paragraph(solution, self.styles['BodyText']))
        story.append(Spacer(1, 0.2 * inch))
        if hasattr(idea, 'target_audience'):
            story.append(Paragraph("Target Audience", self.styles['SectionHeading']))
            audience = getattr(idea, 'target_audience', 'Not specified')
            story.append(Paragraph(audience, self.styles['BodyText']))
        return story
    
    def _build_market_validation_section(self, market_validation: Dict) -> List:
        story = []
        story.append(Paragraph("2. Market Validation", self.styles['CustomTitle']))
        story.append(Spacer(1, 0.2 * inch))
        market_size = market_validation.get('market_size', {})
        if market_size:
            story.append(Paragraph("Market Size Analysis", self.styles['SectionHeading']))
            tam = market_size.get('total_addressable_market', 'Not calculated')
            sam = market_size.get('serviceable_addressable_market', 'Not calculated')
            som = market_size.get('serviceable_obtainable_market', 'Not calculated')
            story.append(Paragraph(f"<b>TAM:</b> {tam}", self.styles['BodyText']))
            story.append(Paragraph(f"<b>SAM:</b> {sam}", self.styles['BodyText']))
            story.append(Paragraph(f"<b>SOM:</b> {som}", self.styles['BodyText']))
            story.append(Spacer(1, 0.2 * inch))
        trends = market_validation.get('market_trends', [])
        if trends:
            story.append(Paragraph("Key Market Trends", self.styles['SectionHeading']))
            for trend in trends[:5]:
                trend_text = trend.get('trend', str(trend)) if isinstance(trend, dict) else str(trend)
                story.append(Paragraph(f"• {trend_text}", self.styles['Bullet']))
        return story
    
    def _build_competitor_section(self, competitor_analysis: Dict) -> List:
        story = []
        story.append(Paragraph("3. Competitive Analysis", self.styles['CustomTitle']))
        story.append(Spacer(1, 0.2 * inch))
        competitors = competitor_analysis.get('competitor_comparison', [])
        for i, comp in enumerate(competitors[:5], 1):
            story.append(Paragraph(f"{i}. {comp.get('name', 'Unknown')}", self.styles['SectionHeading']))
            if comp.get('overview'):
                story.append(Paragraph(comp['overview'], self.styles['BodyText']))
            strengths = comp.get('strengths', [])
            if strengths:
                story.append(Paragraph("Strengths:", self.styles['SubsectionHeading']))
                for strength in strengths[:3]:
                    story.append(Paragraph(f"• {strength}", self.styles['Bullet']))
            weaknesses = comp.get('weaknesses', [])
            if weaknesses:
                story.append(Paragraph("Weaknesses:", self.styles['SubsectionHeading']))
                for weakness in weaknesses[:3]:
                    story.append(Paragraph(f"• {weakness}", self.styles['Bullet']))
            story.append(Spacer(1, 0.15 * inch))
        return story
    
    def _build_quality_section(self, quality_evaluation: Dict) -> List:
        story = []
        story.append(Paragraph("4. Quality Assessment", self.styles['CustomTitle']))
        story.append(Spacer(1, 0.2 * inch))
        avg_score = quality_evaluation.get('average_score', 0)
        passed = quality_evaluation.get('overall_passed', False)
        status = "PASSED ✓" if passed else "NEEDS IMPROVEMENT"
        color = colors.green if passed else colors.red
        story.append(Paragraph(
            f"Overall Quality Score: <font color='#{color.hexval()}'>{avg_score}/10 - {status}</font>",
            self.styles['SectionHeading']
        ))
        return story
    
    def _build_recommendations_section(self, market_validation: Dict, competitor_analysis: Dict) -> List:
        story = []
        story.append(Paragraph("5. Strategic Recommendations", self.styles['CustomTitle']))
        story.append(Spacer(1, 0.2 * inch))
        recommendations = competitor_analysis.get('strategic_recommendations', [])
        if recommendations:
            for i, rec in enumerate(recommendations[:5], 1):
                recommendation = rec.get('recommendation', 'N/A')
                rationale = rec.get('rationale', 'N/A')
                priority = rec.get('priority', 'medium')
                story.append(Paragraph(f"{i}. {recommendation}", self.styles['SectionHeading']))
                story.append(Paragraph(f"Priority: {priority.upper()}", self.styles['BodyText']))
                story.append(Paragraph(f"Rationale: {rationale}", self.styles['BodyText']))
                story.append(Spacer(1, 0.15 * inch))
        return story
    
    def _build_next_steps(self) -> List:
        story = []
        story.append(Paragraph("6. Next Steps", self.styles['CustomTitle']))
        story.append(Spacer(1, 0.2 * inch))
        next_steps = [
            "Validate core assumptions through customer interviews",
            "Develop minimum viable product (MVP) prototype",
            "Conduct pilot program with early adopters",
            "Refine go-to-market strategy based on initial feedback",
            "Secure initial funding (if required)",
            "Build founding team with identified skill gaps",
            "Establish key partnerships and integrations",
            "Set measurable success metrics and KPIs"
        ]
        for i, step in enumerate(next_steps, 1):
            story.append(Paragraph(f"{i}. {step}", self.styles['Bullet']))
        story.append(Spacer(1, 0.3 * inch))
        story.append(Paragraph(
            "This report provides a foundation for strategic decision-making. "
            "Regular reassessment is recommended as market conditions evolve.",
            self.styles['BodyText']
        ))
        return story
    
    def _add_page_number(self, canvas, doc):
        """Add page numbers to each page."""
        canvas.saveState()
        canvas.setFont('Helvetica', 9)
        page_num = canvas.getPageNumber()
        text = f"Page {page_num}"
        canvas.drawRightString(7.5 * inch, 0.5 * inch, text)
        canvas.restoreState()
