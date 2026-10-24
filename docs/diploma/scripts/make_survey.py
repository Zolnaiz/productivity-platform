# -*- coding: utf-8 -*-
"""Хэрэглэгчийн судалгаа ба SUS асуулга: нэг тодорхойлолтоос хавсралт, маягт, үр дүн.

    python scripts/make_survey.py appendix            -> latex/Appendices/AppendixA.tex, AppendixB.tex
    python scripts/make_survey.py form                -> output/survey_form.txt (Google Forms-д хуулах)
    python scripts/make_survey.py results хариу.csv   -> latex/Figures/survey_*.png, output/survey_summary.md
    python scripts/make_survey.py sus хариу.csv       -> latex/Figures/sus_scores.png, output/sus_summary.md

Google Forms-д асуулт бүрийн гарчгийг кодоор нь эхлүүлнэ ("B1. ..."): CSV-ийн баганыг кодоор нь таньдаг тул
маягтын гарчгийг засварласан ч үр дүн зөв асуулттай тулгагдана. Олон сонголттой асуултын хариуг Google Forms
", "-ээр холбодог тул тэдгээрийн хувилбарт таслал бичихгүй. Үр дүнг зөвхөн бодит хариунаас гаргана.
"""
import csv
import os
import re
import statistics
import sys

import matplotlib.pyplot as plt

from make_charts import INK, LINE, MUTED, NAVY, _style

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LATEX = os.path.join(HERE, 'latex')
FIGURES = os.path.join(LATEX, 'Figures')
OUTPUT = os.path.join(HERE, 'output')

LIKERT = ['1 — огт хэрэггүй', '2', '3', '4', '5 — маш хэрэгтэй']
AGREE = ['1 — огт санал нийлэхгүй', '2', '3', '4', '5 — бүрэн санал нийлнэ']

# (код, асуулт, төрөл, хувилбар): single — нэг сонголт, multi — олон сонголт, scale — 1–5, text — чөлөөт хариулт.
SURVEY = [
    ('A', 'Таны тухай', [
        ('A1', 'Таны байгууллага аль салбарт ажилладаг вэ?', 'single',
         ['Үйлдвэрлэл', 'Худалдаа ба агуулах', 'Үйлчилгээ', 'Төрийн байгууллага', 'Бусад']),
        ('A2', 'Таны албан тушаал', 'single',
         ['Ажилтан', 'Багийн ахлагч эсвэл менежер', 'Удирдлага', 'Бусад']),
        ('A3', 'Танай байгууллага 5S эсвэл lean аргачлал хэрэглэдэг үү?', 'single',
         ['Тийм, тогтмол', 'Тийм, хэсэгчлэн', 'Үгүй', 'Мэдэхгүй']),
    ]),
    ('B', 'Одоогийн ажлын арга', [
        ('B1', 'Та ажлын даалгаврыг голчлон ямар хэлбэрээр авдаг вэ? (хэд хэдийг сонгож болно)', 'multi',
         ['Амаар', 'Чат апп (Messenger/Viber)', 'Имэйл', 'Цаасаар', 'Тусгай систем эсвэл апп']),
        ('B2', '5S аудитын шалгах хуудсыг ямар хэлбэрээр бөглөдөг вэ?', 'single',
         ['Цаасаар', 'Excel эсвэл хүснэгтээр', 'Тусгай програм эсвэл апп', 'Аудит хийдэггүй', 'Мэдэхгүй']),
        ('B3', 'Аудитаар илэрсэн дутагдал засагдсан эсэхийг хэрхэн хянадаг вэ?', 'single',
         ['Хариуцагч ба хугацаатай бүртгэж хянадаг', 'Дараагийн аудитаар л мэддэг', 'Хянадаггүй', 'Мэдэхгүй']),
        ('B4', 'Сарын тайлан бэлтгэхэд дунджаар хэдэн цаг зарцуулдаг вэ?', 'single',
         ['Тайлан бэлтгэдэггүй', '2 цагаас бага', '2–5 цаг', '5–10 цаг', '10 цагаас их']),
        ('B5', 'Ажлын байранд интернэт хэр тасалддаг вэ?', 'single',
         ['Бараг тасалддаггүй', 'Сард хэдэн удаа', 'Долоо хоногт хэдэн удаа', 'Өдөр бүр',
          'Зарим газарт огт байхгүй']),
        ('B6', 'Сайжруулалтын санаагаа голчлон хэрхэн илэрхийлдэг вэ?', 'single',
         ['Санал илэрхийлдэггүй', 'Удирдлагад амаар', 'Санал хайрцаг эсвэл цаасаар', 'Чат эсвэл имэйлээр',
          'Тусгай системээр']),
        ('B7', 'Илэрхийлсэн санаандаа хариу авдаг уу?', 'single',
         ['Үргэлж', 'Заримдаа', 'Бараг авдаггүй', 'Санал илэрхийлж байгаагүй']),
        ('B8', 'Ажлын системийг гар утаснаас ашиглах хэрэгцээ хэр байна вэ?', 'scale', LIKERT),
    ]),
    ('C', 'Системийн боломж хэр хэрэгтэй вэ (1 — огт хэрэггүй, 5 — маш хэрэгтэй)', [
        ('C1', 'Ажил оноож, явцыг хянах', 'scale', LIKERT),
        ('C2', 'Гар утаснаас QR уншуулж 5S аудит хийх', 'scale', LIKERT),
        ('C3', 'Аудитын оноо доогуур бол засах ажил автоматаар үүсэх', 'scale', LIKERT),
        ('C4', 'Өдрийн ажлын бүртгэл', 'scale', LIKERT),
        ('C5', 'Долоо хоногийн тайлан ба сануулга', 'scale', LIKERT),
        ('C6', 'Сарын тайлан автоматаар бүрдэх', 'scale', LIKERT),
        ('C7', 'Сайжруулалтын санаа илгээж хариу авах', 'scale', LIKERT),
        ('C8', 'Өглөөний хурлын самбар', 'scale', LIKERT),
        ('C9', 'Интернэтгүй үед бүртгэл хадгалагдах', 'scale', LIKERT),
    ]),
    ('D', 'Нэмэлт', [
        ('D1', 'Одоогийн ажлын хэрэгсэлд хамгийн их тулгардаг бэрхшээл юу вэ?', 'text', []),
    ]),
]

# Brooke (1996)-ийн SUS: сондгой асуулт эерэг, тэгш асуулт сөрөг өгүүлбэр.
SUS = [
    'Би энэ системийг байнга ашиглах хүсэлтэй байна гэж бодож байна.',
    'Систем шаардлагагүй төвөгтэй санагдсан.',
    'Системийг ашиглахад хялбар гэж бодсон.',
    'Энэ системийг ашиглахын тулд техникийн хүний тусламж хэрэгтэй болно гэж бодож байна.',
    'Системийн янз бүрийн боломжууд хоорондоо сайн уялдсан санагдсан.',
    'Системд нэг мөр бус, зөрүүтэй зүйл хэт олон байна гэж бодсон.',
    'Ихэнх хүн энэ системийг маш хурдан сурна гэж бодож байна.',
    'Системийг ашиглахад их төвөгтэй, болхи санагдсан.',
    'Системийг ашиглахдаа өөртөө итгэлтэй байсан.',
    'Энэ системийг ашиглаж эхлэхээс өмнө их зүйл сурах шаардлагатай байсан.',
]

INTRO = ('Энэхүү асуулга нь ШУТИС-МХТС-ийн оюутан Б.Билгүүний ``Байгууллагын бүтээмжийг дэмжих платформ '
         'хөгжүүлэлт\'\' дипломын ажлын хүрээнд байгууллагын ажлын арга, хэрэгцээг судлах зорилготой. Асуулга '
         'нэргүй, 5 орчим минут үргэлжилнэ. Хариултыг зөвхөн нэгтгэсэн хэлбэрээр дипломын ажилд ашиглана.')

for _, _, questions in SURVEY:
    for code, _, kind, options in questions:
        assert kind != 'multi' or all(', ' not in option for option in options), code


def questions():
    for _, _, items in SURVEY:
        yield from items


# --------------------------------------------------------------------------- appendix, form

def tex(value):
    return value.replace('&', '\\&').replace('%', '\\%').replace('—', '--').replace('–', '--')


def write_appendix():
    lines = ['% make_survey.py-оор үүсгэв. Асуултыг скриптэд засаад дахин үүсгэнэ.', '',
             '\\chapter{Хэрэглэгчийн судалгааны асуулга}', '\\label{AppendixA}',
             tex(INTRO), '']
    for letter, title, items in SURVEY:
        lines += ['\\section*{%s. %s}' % (letter, tex(title)), '\\begin{enumerate}[label={}, leftmargin=0pt]']
        for code, text, kind, options in items:
            lines.append('\\item \\textbf{%s.} %s' % (code, tex(text)))
            if kind == 'text':
                lines.append('\\par\\vspace{0.3cm}\\dotfill\\par\\dotfill')
            elif kind == 'scale':
                lines.append('\\par 1 $\\square$ \\quad 2 $\\square$ \\quad 3 $\\square$ \\quad 4 $\\square$ '
                             '\\quad 5 $\\square$')
            else:
                lines.append('\\begin{itemize}[label=$\\square$]')
                lines += ['  \\item %s' % tex(option) for option in options]
                lines.append('\\end{itemize}')
        lines += ['\\end{enumerate}', '']
    write(os.path.join(LATEX, 'Appendices', 'AppendixA.tex'), lines)

    lines = ['% make_survey.py-оор үүсгэв.', '',
             '\\chapter{Хэрэглэхэд хялбар байдлын асуулга (SUS)}', '\\label{AppendixB}',
             'Туршилтын ажиллагааны төгсгөлд оролцогч бүр системийг ашигласан туршлагаараа дараах арван '
             'өгүүлбэрт 1 (огт санал нийлэхгүй)-ээс 5 (бүрэн санал нийлнэ) хүртэл үнэлгээ өгнө~\\cite{brooke}.', '',
             '\\begin{longtable}{|c|p{9.6cm}|c|c|c|c|c|}', '\\hline',
             '\\textbf{№} & \\textbf{Өгүүлбэр} & \\textbf{1} & \\textbf{2} & \\textbf{3} & \\textbf{4} & '
             '\\textbf{5} \\\\ \\hline']
    lines += ['S%d & %s & $\\square$ & $\\square$ & $\\square$ & $\\square$ & $\\square$ \\\\ \\hline' % (i, tex(item))
              for i, item in enumerate(SUS, 1)]
    lines += ['\\end{longtable}', '',
              'Оноог Brooke-ийн аргаар тооцно: сондгой дугаартай өгүүлбэрийн үнэлгээнээс 1-ийг хасаж, тэгш '
              'дугаартайг 5-аас хасаад нийлбэрийг 2.5-аар үржүүлнэ:',
              '\\begin{equation}', 'SUS = 2.5\\left(\\sum_{i\\in\\{1,3,5,7,9\\}} (s_i - 1) + '
              '\\sum_{i\\in\\{2,4,6,8,10\\}} (5 - s_i)\\right)', '\\end{equation}',
              'Үр дүн 0--100 хооронд байх ба олон судалгааны дундаж болох 68-аас дээш бол хэрэглэхэд хялбар '
              'гэж үзнэ~\\cite{bangor}.']
    write(os.path.join(LATEX, 'Appendices', 'AppendixB.tex'), lines)


def write_form():
    lines = ['GOOGLE FORMS-Д ХУУЛАХ АСУУЛГА', 'Асуулт бүрийн гарчгийг кодоор нь (жишээ нь "B1. ") эхлүүлнэ.', '',
             INTRO.replace('``', '"').replace("''", '"'), '']
    kinds = {'single': 'Нэг сонголт (Multiple choice)', 'multi': 'Олон сонголт (Checkboxes)',
             'scale': 'Шугаман хэмжүүр 1–5 (Linear scale)', 'text': 'Урт хариулт (Paragraph)'}
    for letter, title, items in SURVEY:
        lines += ['=== %s. %s ===' % (letter, title), '']
        for code, text, kind, options in items:
            lines.append('%s. %s' % (code, text))
            lines.append('   [%s]' % kinds[kind])
            if kind in ('single', 'multi'):
                lines += ['   - %s' % option for option in options]
            lines.append('')
    lines += ['=== SUS (туршилтын төгсгөлд тусдаа маягтаар) ===', '']
    lines += ['S%d. %s\n   [Шугаман хэмжүүр 1–5: 1 огт санал нийлэхгүй, 5 бүрэн санал нийлнэ]\n' % (i, item)
              for i, item in enumerate(SUS, 1)]
    write(os.path.join(OUTPUT, 'survey_form.txt'), lines)


def write(path, lines):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8', newline='\n') as handle:
        handle.write('\n'.join(lines) + '\n')
    print(path)


# --------------------------------------------------------------------------- results

def read_responses(path):
    """Google Forms CSV: баганыг гарчгийн эхний кодоор нь ("B1.") таньж, код -> хариултын жагсаалт."""
    with open(path, encoding='utf-8-sig', newline='') as handle:
        rows = list(csv.reader(handle))
    header, body = rows[0], [row for row in rows[1:] if any(cell.strip() for cell in row)]
    columns = {}
    for index, title in enumerate(header):
        match = re.match(r'\s*([A-Z]\d+)\.', title)
        if match:
            columns[match.group(1)] = [row[index].strip() if index < len(row) else '' for row in body]
    return columns, len(body)


def bar_chart(name, labels, counts, total, out, xlabel):
    fig, ax = plt.subplots(figsize=(8.6, 0.55 * len(labels) + 1.2))
    y = range(len(labels))
    ax.barh(list(y), counts, height=0.6, color=NAVY)
    for i, count in enumerate(counts):
        share = 100 * count / total if total else 0
        ax.text(count + max(counts + [1]) * 0.01, i, '%d (%.0f%%)' % (count, share), va='center', fontsize=10,
                color=INK)
    ax.set_yticks(list(y), labels, fontsize=10)
    ax.invert_yaxis()
    ax.set_xlim(0, max(counts + [1]) * 1.25)
    ax.set_xlabel(xlabel, color=MUTED, fontsize=9.5)
    _style(ax)
    fig.savefig(os.path.join(out, name), dpi=200, bbox_inches='tight', facecolor='white')
    plt.close(fig)


def results(path, out=FIGURES):
    columns, respondents = read_responses(path)
    summary = ['# Судалгааны үр дүн', '', 'Эх сурвалж: `%s`, %d хариулагч.' % (os.path.basename(path), respondents), '']
    for code, text, kind, options in questions():
        answers = [answer for answer in columns.get(code, []) if answer]
        if code not in columns:
            summary += ['## %s. %s' % (code, text), '', 'CSV-д энэ асуулт алга.', '']
            continue
        summary += ['## %s. %s' % (code, text), '', 'Хариулсан: %d' % len(answers), '']
        if kind == 'text':
            summary += ['- %s' % answer for answer in answers] + ['']
            continue
        if kind == 'multi':
            picked = [choice.strip() for answer in answers for choice in answer.split(', ')]
        elif kind == 'scale':
            picked = [answer.split()[0] for answer in answers]
            options = ['1', '2', '3', '4', '5']
        else:
            picked = answers
        counts = [picked.count(option) for option in options]
        other = len(picked) - sum(counts)
        labels = list(options) + (['Бусад хариулт'] if other else [])
        counts += [other] if other else []
        summary += ['| Хувилбар | Тоо |', '|---|---:|'] + ['| %s | %d |' % pair for pair in zip(labels, counts)]
        if kind == 'scale' and answers:
            scores = [int(value) for value in picked if value in options]
            summary.append('')
            summary.append('Дундаж: %.2f' % statistics.mean(scores))
        summary.append('')
        bar_chart('survey_%s.png' % code, labels, counts, len(answers), out,
                  'Хариулагчийн тоо' + (' (олон сонголт)' if kind == 'multi' else ''))
    write(os.path.join(OUTPUT, 'survey_summary.md'), summary)


def sus_score(values):
    """Brooke: сондгой (s − 1), тэгш (5 − s), нийлбэр × 2.5."""
    return 2.5 * sum((value - 1) if i % 2 == 0 else (5 - value) for i, value in enumerate(values))


def sus(path, out=FIGURES):
    columns, respondents = read_responses(path)
    codes = ['S%d' % i for i in range(1, 11)]
    missing = [code for code in codes if code not in columns]
    if missing:
        sys.exit('CSV-д SUS-ийн багана дутуу: %s' % ', '.join(missing))
    scores = []
    for row in zip(*(columns[code] for code in codes)):
        if all(cell for cell in row):
            scores.append(sus_score([int(cell.split()[0]) for cell in row]))
    if not scores:
        sys.exit('Бүрэн бөглөсөн SUS хариу алга.')
    mean = statistics.mean(scores)
    sd = statistics.stdev(scores) if len(scores) > 1 else 0
    summary = ['# SUS үр дүн', '', 'Бүрэн бөглөсөн: %d / %d' % (len(scores), respondents),
               'Дундаж: %.1f, стандарт хазайлт: %.1f, хамгийн бага %.1f, их %.1f' % (mean, sd, min(scores), max(scores)),
               'Жишиг 68-аас %s.' % ('дээш' if mean > 68 else 'доош эсвэл тэнцүү'), '']
    summary += ['- %.1f' % score for score in scores]
    write(os.path.join(OUTPUT, 'sus_summary.md'), summary)

    fig, ax = plt.subplots(figsize=(8.6, 3.2))
    ax.hist(scores, bins=[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100.01], color=NAVY, edgecolor='white')
    ax.axvline(68, color='#B85042', lw=1.4, ls='--')
    label = dict(fontsize=9.5, bbox=dict(fc='white', ec='none', pad=1))
    ax.text(68.5, ax.get_ylim()[1] * 0.92, 'жишиг 68', color='#B85042', **label)
    ax.axvline(mean, color=INK, lw=1.4)
    ax.text(mean + 0.5, ax.get_ylim()[1] * 0.78, 'дундаж %.1f' % mean, color=INK, **label)
    ax.set_xlim(0, 100)
    ax.set_xlabel('SUS оноо (0–100), %d хариулагч' % len(scores), color=MUTED, fontsize=9.5)
    _style(ax)
    ax.yaxis.grid(True, color=LINE, lw=0.8)
    fig.savefig(os.path.join(out, 'sus_scores.png'), dpi=200, bbox_inches='tight', facecolor='white')
    plt.close(fig)


if __name__ == '__main__':
    command = sys.argv[1] if len(sys.argv) > 1 else ''
    if command == 'appendix':
        write_appendix()
    elif command == 'form':
        write_form()
    elif command in ('results', 'sus') and len(sys.argv) > 2:
        target = sys.argv[3] if len(sys.argv) > 3 else FIGURES
        (results if command == 'results' else sus)(sys.argv[2], target)
    else:
        sys.exit(__doc__)
