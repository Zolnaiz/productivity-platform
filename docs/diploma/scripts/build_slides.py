# -*- coding: utf-8 -*-
"""Үзлэг 1-ийн илтгэл (.pptx). python build_slides.py"""
import os

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Cm, Pt

import content as C

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIG = os.path.join(HERE, 'fig')
NAVY = RGBColor(0x16, 0x20, 0x2C)
BLUE = RGBColor(0x1D, 0x4E, 0xD8)
INK = RGBColor(0x1F, 0x29, 0x37)
MUTED = RGBColor(0x4B, 0x55, 0x63)
TAPE = RGBColor(0xF5, 0xC5, 0x18)
FONT = 'Arial'

prs = Presentation()
prs.slide_width, prs.slide_height = Cm(33.867), Cm(19.05)
W, H = prs.slide_width, prs.slide_height
blank = prs.slide_layouts[6]


def text(slide, x, y, w, h, value, size=18, bold=False, color=INK, align=PP_ALIGN.LEFT):
    box = slide.shapes.add_textbox(x, y, w, h)
    frame = box.text_frame
    frame.word_wrap = True
    lines = value if isinstance(value, list) else [value]
    for i, line in enumerate(lines):
        p = frame.paragraphs[0] if i == 0 else frame.add_paragraph()
        run = p.add_run()
        run.text = line
        run.font.size, run.font.bold, run.font.name = Pt(size), bold, FONT
        run.font.color.rgb = color
        p.alignment = align
        p.space_after = Pt(8)
    return box


def slide(title, number, notes=''):
    s = prs.slides.add_slide(blank)
    bar = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, W, Cm(0.35))
    bar.fill.solid(); bar.fill.fore_color.rgb = TAPE; bar.line.fill.background()
    text(s, Cm(1.6), Cm(0.9), Cm(30), Cm(2), title, size=30, bold=True, color=NAVY)
    text(s, Cm(30.5), Cm(17.6), Cm(2.5), Cm(1), str(len(prs.slides._sldIdLst)), size=12, color=MUTED, align=PP_ALIGN.RIGHT)
    if notes:
        s.notes_slide.notes_text_frame.text = notes
    return s


def bullets(s, items, x=Cm(1.6), y=Cm(3.4), w=Cm(30.5), size=20):
    return text(s, x, y, w, Cm(14), ['•  ' + item for item in items], size=size)


def picture(s, name, x, y, w=None, h=None):
    s.shapes.add_picture(os.path.join(FIG, name), x, y, width=w, height=h)


# 1. Нүүр
s = prs.slides.add_slide(blank)
bg = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, W, H)
bg.fill.solid(); bg.fill.fore_color.rgb = NAVY; bg.line.fill.background()
tape = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, Cm(1.6), Cm(4.2), Cm(3), Cm(0.3))
tape.fill.solid(); tape.fill.fore_color.rgb = TAPE; tape.line.fill.background()
text(s, Cm(1.6), Cm(1.6), Cm(30), Cm(1.5), 'Бакалаврын дипломын төсөл · Үзлэг 1', size=16, color=RGBColor(0xCB, 0xD5, 0xE1))
text(s, Cm(1.6), Cm(5.0), Cm(30), Cm(5), C.TITLE, size=36, bold=True, color=RGBColor(0xFF, 0xFF, 0xFF))
text(s, Cm(1.6), Cm(11.6), Cm(30), Cm(4), ['Гүйцэтгэсэн: Б.Билгүүн (B190910014) · Программ хангамжийн инженерчлэл',
     'Удирдагч: Доктор (Ph.D), дэд профессор Г.Ганчимэг', 'ШУТИС, МХТС, Компьютерийн ухааны тэнхим · 2026.09.30'],
     size=16, color=RGBColor(0xE5, 0xE7, 0xEB))
s.notes_slide.notes_text_frame.text = ('Сайн байна уу. Би Б.Билгүүн. Миний дипломын сэдэв бол "Байгууллагын бүтээмжийг '
                                       'дэмжих платформ хөгжүүлэлт" — өөрийн санаачилгаар хөгжүүлж буй 5S ба ажлын '
                                       'удирдлагын вэб, гар утасны платформ.')

# 2. Асуудал
s = slide('Асуудал', 2, 'Одоо 5S нэвтрүүлсэн байгууллагад мэдээлэл цаас, Excel, чатад тарамдсан. '
          'Аудитаар олсон дутагдал засагдсан эсэхийг хэн ч хянадаггүй, тайланг гараар нэгтгэдэг.')
bullets(s, [
    '5S аудит цаасаар; илэрсэн дутагдлыг хэн, хэзээ засах нь тодорхойгүй',
    'Менежер ажлын явцыг бодит хугацаанд харахгүй; хоцролт хурал дээр л илэрдэг',
    'Сарын, хагас жилийн, жилийн тайланг гараар нэгтгэдэг',
    'Ажилчдын санаа бүртгэгдэхгүй, хариугүй үлддэг',
    'Цех, агуулахад интернэт тасалддаг',
    'Байгууллагын түүх, шийдвэр архивлагддаггүй',
])

# 3. Зорилго, зорилт
s = slide('Зорилго ба зорилт', 3, 'Зорилго бол 5S, бүтээмжийн хэрэгслийг өдөр тутмын ажилтай нэг системд холбох.')
text(s, Cm(1.6), Cm(3.3), Cm(30.5), Cm(3), 'Бүтээмжийн хэрэгслүүд болон ажлын удирдлагыг нэгтгэж, ажлыг бодит хугацаанд '
     'оноож хянах, тайланг автоматаар гаргах вэб ба гар утасны платформ бүтээх', size=20, bold=True, color=BLUE)
bullets(s, [
    'Онол судлах: 5S, Gemba, Kaizen, шатлалт өдөр тутмын хурал',
    'Ижил төстэй 5 системийг харьцуулах, SWOT шинжилгээ',
    'Шаардлага, use-case, архитектур, алгоритмыг зохиомжлох',
    'Backend, вэб, гар утасны аппыг хөгжүүлж тестлэх',
    'Туршилтын байгууллагад ажиллуулж, SUS аргаар үнэлэх',
], y=Cm(6.6))

# 4. Онол
s = slide('Онол, аргазүй', 4, '5S нь таван үе шат. Хамгийн чухал нь сүүлийн S буюу дадал болгох. '
          'Үүнийг сануулга, хуваарь, хурал дэмждэг.')
cols = [('5S', ['Ангилах · Цэгцлэх · Цэвэрлэх', 'Стандартчлах · Төлөвшүүлэх', 'Аудит 0–5 оноогоор хэмжинэ']),
        ('Gemba, Kaizen', ['Удирдлага цех дээр очиж ажиглана', 'Жижиг, тасралтгүй сайжруулалт', 'Ажилчдын санаа']),
        ('Lean удирдлага', ['Өглөөний хурал (10 мин)', 'Долоо хоногийн тайлан', 'Leader standard work'])]
for i, (head, items) in enumerate(cols):
    x = Cm(1.6 + i * 10.4)
    card = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, Cm(3.5), Cm(9.8), Cm(10))
    card.fill.solid(); card.fill.fore_color.rgb = RGBColor(0xEF, 0xF4, 0xFF); card.line.color.rgb = RGBColor(0xBF, 0xDB, 0xFE)
    card.adjustments[0] = 0.06
    text(s, x + Cm(0.6), Cm(4.0), Cm(8.6), Cm(1.5), head, size=22, bold=True, color=NAVY)
    text(s, x + Cm(0.6), Cm(5.8), Cm(8.6), Cm(7), ['• ' + t for t in items], size=17)
text(s, Cm(1.6), Cm(14.6), Cm(30), Cm(2), 'Эх сурвалж: Hirano (1995), Imai (1997), Liker (2004), Mann (2005)', size=13, color=MUTED)

# 5. Харьцуулалт
s = slide('Ижил төстэй системүүд', 5, 'Гадны системүүд тус бүр нэг хэсэгт сайн боловч бүгдийг нэг дор, монгол хэл дээр, '
          'өөрийн серверт байршуулах шийдэл алга. Эдгээрийн шилдэг туршлагыг нэгтгэсэн.')
header = ['Боломж', 'SafetyCulture', 'Weekdone', 'Asana', 'KaiNexus', 'Tervene', 'Энэ төсөл']
rows = [r for r in next(item for item in C.BODY if item[0] == 'table' and item[1].startswith('Хүснэгт 1.2'))[3]]
tbl = s.shapes.add_table(len(rows) + 1, len(header), Cm(1.6), Cm(3.2), Cm(30.6), Cm(13)).table
for j, h in enumerate(header):
    tbl.cell(0, j).text = h
for i, row in enumerate(rows, 1):
    for j, v in enumerate(row):
        tbl.cell(i, j).text = v
for i in range(len(rows) + 1):
    for j in range(len(header)):
        for p in tbl.cell(i, j).text_frame.paragraphs:
            p.alignment = PP_ALIGN.LEFT if j == 0 else PP_ALIGN.CENTER
            for r in p.runs:
                r.font.size = Pt(13); r.font.name = FONT
                r.font.bold = i == 0 or j == 6
tbl.columns[0].width = Cm(9.0)
for j in range(1, 7):
    tbl.columns[j].width = Cm(3.6)

# 6. Шаардлага
s = slide('Шаардлага', 6, '21 функциональ, 10 функциональ бус шаардлага. MoSCoW-оор эрэмбэлсэн.')
text(s, Cm(1.6), Cm(3.2), Cm(15), Cm(1), 'Функциональ (21)', size=20, bold=True, color=BLUE)
bullets(s, ['Ажил оноох, хянах, сануулах', '5S талбай, QR аудит, улаан шошго', 'Аудит < 85% → засах ажил автоматаар',
            'Өглөөний хурал, Gemba, санаа', 'Сарын тайлан автоматаар, архив', 'Сүлжээгүй горим (утас)'],
        x=Cm(1.6), y=Cm(4.4), w=Cm(15), size=17)
text(s, Cm(17.4), Cm(3.2), Cm(15), Cm(1), 'Функциональ бус (10)', size=20, bold=True, color=BLUE)
bullets(s, ['JWT, эрхийг сервер тал шалгана (RBAC)', 'Байгууллага бүрийн өгөгдөл тусгаарлагдана',
            'WCAG 2.1 AA, SUS ≥ 68', 'Давхар илгээлтгүй, өгөгдөл алдагдахгүй', 'Монгол, англи хэл',
            'AI-д зөвхөн нэргүй тоо'], x=Cm(17.4), y=Cm(4.4), w=Cm(15), size=17)

# 7. Use-case
s = slide('Use-case загвар', 7, 'Дөрвөн дүр үүрлэсэн: ажиглагч, ажилтан, менежер, админ. Дээд дүр доод дүрийн эрхийг өвлөнө. '
          'Цагийн хуваарь нь сануулга, сар хаах зэргийг автоматаар гүйцэтгэнэ.')
picture(s, 'usecase.png', Cm(1.6), Cm(3.0), h=Cm(15.6))
text(s, Cm(21.2), Cm(3.6), Cm(11.5), Cm(12), ['Дүр:', '• Ажиглагч – унших', '• Ажилтан – ажил, аудит, санаа',
     '• Менежер – оноох, хурал, тайлан', '• Админ – хэрэглэгч, тохиргоо', '', '7 use-case бүрэн тодорхойлсон',
     '(үндсэн ба өөр урсгалтай)'], size=16)

# Класс диаграмм
s = slide('Класс диаграмм', 8, 'Домэйн классууд: байгууллага, хэрэглэгч, ажил, 5S талбай, аудит, санаа, Gemba. '
          'Ажил нь аудит, Gemba, санаанаас үүсэх бөгөөд эх сурвалжаа хадгална.')
picture(s, 'class_analysis.png', Cm(5.5), Cm(2.9), h=Cm(15.8))

# Дарааллын диаграмм
s = slide('Дарааллын диаграмм: 5S аудит', 8, 'Гар утаснаас аудит илгээхэд оноо 85%-иас доош бол засах ажил үүсэж, '
          'бүсийн эзэнд мэдэгдэл очно. Сүлжээгүй бол утсанд хүлээлгэнэ.')
picture(s, 'seq_audit.png', Cm(4.0), Cm(2.9), h=Cm(15.8))

# Үйл ажиллагааны диаграмм
s = slide('Үйл ажиллагааны диаграмм', 8, 'Ажил оноогдохоос дуусах хүртэл менежер, систем, ажилтан гэсэн гурван оролцогч.')
picture(s, 'activity_task.png', Cm(8.0), Cm(2.9), h=Cm(15.8))

# 8. Архитектур
s = slide('Архитектур ба технологи', 8, 'Хоёр клиент нэг REST API ашиглана, бизнесийн дүрэм нэг газар. '
          'NestJS, PostgreSQL, React, Flutter. Docker-оор байршина.')
picture(s, 'architecture.png', Cm(1.6), Cm(3.0), w=Cm(19.5))
text(s, Cm(21.8), Cm(3.4), Cm(11), Cm(13), ['• NestJS 11 + TypeORM', '• PostgreSQL: 25 хүснэгт, 38 migration',
     '• React 18 + Vite + Tailwind', '• Flutter (Android, iOS)', '• JWT + дүрийн эрх', '• Cron: сануулга, аудит, сар хаах',
     '• Docker Compose'], size=16)

# 9. Алгоритм
s = slide('Гол алгоритмууд', 9, 'Нэгдүгээрт: аудитын оноо 85%-иас доош бол талбайн эзэнд 7 хоногийн хугацаатай засах ажил автоматаар үүснэ, '
          '70%-иас доош бол өндөр ач холбогдолтой. Хоёрдугаарт: сүлжээгүй үед утсанд хадгалж, давхар бүртгэлээс сэргийлнэ.')
picture(s, 'audit_flow.png', Cm(1.6), Cm(2.9), h=Cm(15.7))
picture(s, 'outbox.png', Cm(14.2), Cm(3.2), w=Cm(18.4))
text(s, Cm(14.2), Cm(11.8), Cm(18.4), Cm(6), ['• Оноо = Σ авсан / Σ боломжит × 100, O(n)',
     '• Сануулга: байгууллагын цагийн бүсээр, өдөрт нэг удаа', '• Сарын тайлан: хаагдахад хуулбар хадгалагдана',
     '• Офлайн: зөвхөн серверт хүрээгүйг дахин илгээнэ'], size=15)

# Өгөгдлийн сан
s = slide('Өгөгдлийн сангийн схем', 8, '25 хүснэгт, 38 migration. Бүх хүснэгт байгууллагаар тусгаарлагдана.')
picture(s, 'er.png', Cm(5.0), Cm(2.9), h=Cm(15.8))

# Интерфейс
s = slide('Хэрэглэгчийн интерфейс', 8, 'Вэб: өглөөний хурлын самбар. Гар утас: ажил, 5S талбай, бүс, мэдэгдэл.')
picture(s, 'ui_huddle.png', Cm(1.2), Cm(3.2), w=Cm(16.5))
picture(s, 'ui_mobile.png', Cm(18.2), Cm(3.6), w=Cm(15.0))

# Эдийн засаг
s = slide('Эдийн засгийн үр ашиг (урьдчилсан)', 8, '25 ажилтантай жишээ байгууллагад хэмнэгдэх цагийн таамаглалаар тооцов. '
          'Туршилтын үед бодит хэмнэлтийг хэмжиж шинэчилнэ.')
text(s, Cm(1.6), Cm(3.4), Cm(30), Cm(12), ['• Анхны хөрөнгө оруулалт: 24.0 сая ₮', '• Жилийн өгөөж (3 408 цаг хэмнэлт): 40.9 сая ₮',
     '• Жилийн зардал: 6.9 сая ₮', '• NPV (5 жил, r = 12%): 98.5 сая ₮', '• Нөхөх хугацаа: ≈ 0.79 жил (9.5 сар)',
     '• Нийт бүтээмж: 1₮ зардалд 5.93₮ өгөөж'], size=20)

# 10. Явц
s = slide('Одоогийн явц ба төлөвлөгөө', 10, 'Хэрэгжилт үзлэгийн хуваарийг гүйцэж, үндсэн хэсэг ажиллаж байна. '
          'Үзлэг 2 гэхэд серверт байршуулж, Үзлэг 3 гэхэд туршилтын байгууллагад ажиллуулж SUS үнэлгээ хийнэ.')
picture(s, 'ui_huddle.png', Cm(1.6), Cm(3.1), w=Cm(15.5))
text(s, Cm(17.8), Cm(3.1), Cm(15), Cm(6), ['✓ Backend – 830 тест', '✓ Вэб – 1017 тест, 39 e2e', '✓ Гар утас – 115 тест',
     '✓ Монгол / англи, WCAG 2.1 AA'], size=17, bold=True, color=RGBColor(0x15, 0x80, 0x3D))
text(s, Cm(17.8), Cm(9.2), Cm(15), Cm(8), ['Үзлэг 2 (11.03) – серверт байршуулах, туршилт', 'Үзлэг 3 (12.02) – туршилтын ажиллагаа, SUS',
     'Урьдчилсан хамгаалалт (12.28)'], size=16)

# 11. Баярлалаа
s = prs.slides.add_slide(blank)
bg = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, W, H)
bg.fill.solid(); bg.fill.fore_color.rgb = NAVY; bg.line.fill.background()
text(s, Cm(1.6), Cm(7), Cm(30.6), Cm(3), 'Анхаарал хандуулсанд баярлалаа', size=40, bold=True,
     color=RGBColor(0xFF, 0xFF, 0xFF), align=PP_ALIGN.CENTER)
text(s, Cm(1.6), Cm(10.5), Cm(30.6), Cm(2), 'Асуулт, санал', size=22, color=TAPE, align=PP_ALIGN.CENTER)

out = os.path.join(HERE, 'output', 'Uzleg1_iltgel.pptx')
prs.save(out)
print(out)
