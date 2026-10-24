# -*- coding: utf-8 -*-
"""II үзлэгийн график, диаграм: python scripts/make_charts.py -> latex/Figures/*.png

Тоог гараар бичихгүй: тестийн тоо docs/RESULTS.md-ээс, хугацааны хэмжилт docs/benchmark-results*.json-оос
уншина. Тэдгээрийг backend-ийн `npm run results`, `npm run bench` үүсгэдэг тул дахин хэмжсэний дараа энэ
скриптийг ажиллуулахад график шинэчлэгдэнэ. build_slides2.py ч тоогоо эндээс авна.
"""
import json
import os
import re

import matplotlib.pyplot as plt

from make_figures import arrow, box, canvas, save

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
DOCS = os.path.join(ROOT, 'docs')

NAVY = '#16202C'
YELLOW = '#F5C518'
INK = '#202A35'
MUTED = '#65717D'
LINE = '#D8DEE4'
CARD = '#F3F5F7'
GREEN = '#2F7D68'
AMBER = '#A86B0C'
RED = '#B85042'
PALE_GREEN = '#E3F1EC'
PALE_AMBER = '#FBEFD9'
PALE_RED = '#F6E3E0'

# I үзлэгийн (2026.09.30) тоо: дипломын 3-р бүлгийн «Туршилтын түвшин» хүснэгт.
REVIEW1_TESTS = {'backend': 927, 'uc': 0, 'web': 1033, 'mobile': 125, 'e2e': 39}

SUITES = [('backend', 'Backend unit + HTTP', 'Backend (Jest)'),
          ('uc', 'Use-case acceptance', 'Use-case хүлээн авах'),
          ('web', 'Web (vitest)', 'Вэб (Vitest)'),
          ('mobile', 'Mobile (flutter test)', 'Гар утас (Flutter)'),
          ('e2e', 'Browser e2e', 'Хөтчийн e2e (Playwright)')]

ENDPOINTS = {'POST /auth/login': 'Нэвтрэх',
             'GET /tasks (manager, whole organization)': 'Ажлын жагсаалт (бүх байгууллага)',
             'POST /work-logs/daily': 'Өдрийн бүртгэл хадгалах',
             'POST /audit-runs (submit)': '5S аудит илгээх',
             'GET /operations/monthly-report (manager, K1–K6)': 'Сарын тайлан (K1–K6)',
             'Report CSV (report fetch + CSV serialisation)': 'Тайлан CSV татах',
             'K1 + K3 (monthlyMeasurements), 10,000 records': 'K1 + K3 тооцоо (10 000 бүртгэл)',
             'Audit score (scoreAnswers), 10,000 audits × 10 questions': 'Аудитын оноо (10 000 × 10 асуулт)'}


def read_results():
    """RESULTS.md: suite бүрийн passed/failed/skipped, мөн commit ба огноо."""
    text = open(os.path.join(DOCS, 'RESULTS.md'), encoding='utf-8').read()
    counts = {}
    for key, prefix, _ in SUITES:
        row = re.search(r'^\| ' + re.escape(prefix) + r'[^|]*\|[^|]*\| (\d+) \| (\d+) \| (\d+) \|', text, re.M)
        counts[key] = {'passed': int(row.group(1)), 'failed': int(row.group(2)), 'skipped': int(row.group(3))}
    stamp = re.search(r'Commit `([0-9a-f]+)`, (\d{4}-\d{2}-\d{2})', text)
    uc = re.search(r'\*\*(\d+) / (\d+)\*\* use case', text)
    return {'suites': counts, 'commit': stamp.group(1), 'date': stamp.group(2),
            'uc_passed': int(uc.group(1)), 'uc_total': int(uc.group(2))}


def read_use_cases():
    """RESULTS.md-ийн 2-р хэсэг: UC бүрийн дугаар, нэр, давсан тестийн тоо, үр дүн."""
    text = open(os.path.join(DOCS, 'RESULTS.md'), encoding='utf-8').read()
    rows = re.findall(r'^\| (UC-\d+) \| ([^|]+) \| [^|]+ \| ([^|]+) \| (\w+) \|$', text, re.M)
    return [{'id': uc, 'name': name.strip(), 'tests': tests.count('✓'), 'result': result}
            for uc, name, tests, result in rows]


def read_benchmark(name='benchmark-results.json'):
    return json.load(open(os.path.join(DOCS, name), encoding='utf-8'))


def _style(ax):
    for side in ('top', 'right', 'left'):
        ax.spines[side].set_visible(False)
    ax.spines['bottom'].set_color(LINE)
    ax.tick_params(colors=INK, length=0)
    ax.xaxis.grid(True, color=LINE, lw=0.8)
    ax.set_axisbelow(True)


def tests_by_suite(results):
    """I ба II үзлэгийн хоорондох тестийн өсөлт, suite бүрээр."""
    now = results['suites']
    labels = [label for _, _, label in SUITES]
    before = [REVIEW1_TESTS[key] for key, _, _ in SUITES]
    after = [now[key]['passed'] for key, _, _ in SUITES]
    fig, ax = plt.subplots(figsize=(8.6, 4.2))
    y = range(len(labels))
    ax.barh([i + 0.2 for i in y], before, height=0.38, color=LINE, label='I үзлэг · 2026.09.30')
    ax.barh([i - 0.2 for i in y], after, height=0.38, color=NAVY, label='II үзлэг · ' + results['date'].replace('-', '.'))
    for i, (b, a) in enumerate(zip(before, after)):
        ax.text(a + 12, i - 0.2, f'{a:,}'.replace(',', ' '), va='center', fontsize=10, color=INK, fontweight='bold')
        ax.text(b + 12, i + 0.2, f'{b:,}'.replace(',', ' ') if b else 'байгаагүй', va='center', fontsize=9,
                color=MUTED)
    ax.set_yticks(list(y), labels, fontsize=10.5)
    ax.invert_yaxis()
    ax.set_xlim(0, max(after) * 1.16)
    ax.set_xlabel('Амжилттай тестийн тоо', color=MUTED, fontsize=9.5)
    _style(ax)
    ax.legend(loc='lower right', frameon=False, fontsize=9.5)
    save(fig, 'tests_by_suite.png')


def benchmark_p95(bench):
    """Endpoint бүрийн p95 хугацаа ба NFR-06-ийн 2 секундын босго."""
    rows = bench['endpoints']
    labels = [ENDPOINTS.get(r['endpoint'], r['endpoint']) for r in rows]
    p50 = [r['p50'] for r in rows]
    p95 = [r['p95'] for r in rows]
    limit = bench['nfr06ThresholdMs']
    fig, ax = plt.subplots(figsize=(8.6, 4.0))
    y = range(len(rows))
    ax.barh(list(y), p95, height=0.55, color=NAVY, label='p95')
    ax.scatter(p50, list(y), color=YELLOW, edgecolor=NAVY, zorder=3, s=36, label='p50 (медиан)')
    for i, value in enumerate(p95):
        ax.text(value + 25, i, f'{value:.0f} мс', va='center', fontsize=10, color=INK, fontweight='bold')
    ax.axvline(limit, color=RED, lw=1.6, ls='--')
    ax.text(limit - 20, len(rows) - 0.45, f'NFR-06 босго\n{limit} мс', ha='right', va='bottom', fontsize=9.5,
            color=RED)
    ax.set_yticks(list(y), labels, fontsize=10.5)
    ax.invert_yaxis()
    ax.set_xlim(0, limit * 1.08)
    ax.set_xlabel('Хариу өгөх хугацаа, мс (200 хүсэлт, 10 000 бүртгэлтэй сан)', color=MUTED, fontsize=9.5)
    _style(ax)
    ax.legend(loc='lower right', bbox_to_anchor=(1.0, 1.0), ncol=2, frameon=False, fontsize=9.5)
    save(fig, 'bench_p95.png')


def benchmark_before_after(before, after):
    """Formatter-ийг кэшлэхийн өмнө ба дараа: удаан байсан гурван хэмжилт."""
    names = ['GET /operations/monthly-report (manager, K1–K6)', 'Report CSV (report fetch + CSV serialisation)',
             'K1 + K3 (monthlyMeasurements), 10,000 records']
    pick = lambda data, name: next(r for r in data['endpoints'] + data['algorithms']
                                   if r.get('endpoint', r.get('name')) == name)
    old = [pick(before, n)['p95'] for n in names]
    new = [pick(after, n)['p95'] for n in names]
    fig, ax = plt.subplots(figsize=(8.6, 3.3))
    y = range(len(names))
    ax.barh([i - 0.2 for i in y], old, height=0.38, color=RED, label='Засахаас өмнө')
    ax.barh([i + 0.2 for i in y], new, height=0.38, color=GREEN, label='Засварын дараа')
    for i, (o, n) in enumerate(zip(old, new)):
        ax.text(o + 25, i - 0.2, f'{o:,.0f} мс'.replace(',', ' '), va='center', fontsize=10, color=RED,
                fontweight='bold', bbox=dict(fc='white', ec='none', pad=1))
        ax.text(n + 25, i + 0.2, f'{n:,.0f} мс  (×{o / n:.0f} хурдан)'.replace(',', ' '), va='center', fontsize=10,
                color=GREEN, fontweight='bold')
    limit = after['nfr06ThresholdMs']
    ax.axvline(limit, color=MUTED, lw=1.2, ls='--')
    ax.text(limit + 20, len(names) - 0.55, 'NFR-06: 2000 мс', ha='left', va='center', fontsize=9, color=MUTED)
    ax.set_yticks(list(y), [ENDPOINTS[n] for n in names], fontsize=10.5)
    ax.invert_yaxis()
    ax.set_xlim(0, limit * 1.22)
    ax.set_xlabel('p95, мс', color=MUTED, fontsize=9.5)
    _style(ax)
    ax.legend(loc='lower right', bbox_to_anchor=(1.0, 1.0), ncol=2, frameon=False, fontsize=9.5)
    save(fig, 'bench_before_after.png')


def fix_verification():
    """PDCA «Шалгах»: аудитаас үүссэн засварыг дараагийн аудитаар ангилах дүрэм."""
    fig, ax = canvas(12, 5.4)
    box(ax, 0.2, 2.35, 1.9, 0.75, 'Аудит < 85%\nзасах ажил үүснэ', fc=CARD, size=9.5, bold=True)
    box(ax, 2.7, 2.35, 1.7, 0.75, 'Ажил\nдууссан уу?', fc=CARD, size=9.5)
    arrow(ax, 2.1, 2.72, 2.7, 2.72)
    box(ax, 2.7, 4.15, 1.7, 0.6, 'open', fc='white', size=9.5, bold=True)
    arrow(ax, 3.55, 3.1, 3.55, 4.15, 'үгүй')
    box(ax, 5.0, 2.35, 1.9, 0.75, 'Дууссан огноо\nбүртгэгдсэн үү?', fc=CARD, size=9.5)
    arrow(ax, 4.4, 2.72, 5.0, 2.72, 'тийм')
    box(ax, 5.0, 4.15, 1.9, 0.6, 'done_undated', fc='white', size=9.5, bold=True)
    arrow(ax, 5.95, 3.1, 5.95, 4.15, 'үгүй')
    box(ax, 5.0, 0.55, 1.9, 0.95, 'Дараа нь тухайн\nбүсэд аудит\nхийгдсэн үү?', fc=CARD, size=9.5)
    arrow(ax, 5.95, 2.35, 5.95, 1.5, 'тийм')
    box(ax, 2.7, 0.72, 1.9, 0.6, 'awaiting_reaudit', fc='white', size=9.5, bold=True)
    arrow(ax, 5.0, 1.02, 4.6, 1.02, 'үгүй')
    box(ax, 7.5, 1.62, 1.9, 0.75, 'Дараагийн\nаудитын оноо', fc=CARD, size=9.5)
    ax.plot([6.9, 8.45], [1.02, 1.02], color=INK, lw=1.1)
    arrow(ax, 8.45, 1.02, 8.45, 1.62)
    ax.text(7.3, 1.09, 'тийм', fontsize=8, ha='center', va='bottom', color='#374151')
    outcomes = [(3.15, 'verified\n≥ 85', PALE_GREEN, GREEN), (1.62, 'improved\nөмнөхөөс өндөр', PALE_AMBER, AMBER),
                (0.09, 'not_improved\nижил эсвэл доош', PALE_RED, RED)]
    ax.plot([9.4, 9.65], [2.0, 2.0], color=INK, lw=1.1)
    ax.plot([9.65, 9.65], [0.47, 3.53], color=INK, lw=1.1)
    for y, name, fill, edge in outcomes:
        box(ax, 9.9, y, 2.0, 0.75, name, fc=fill, ec=edge, size=9.5, bold=True)
        arrow(ax, 9.65, y + 0.375, 9.9, y + 0.375)
    ax.text(10.9, 4.6, 'Баталгаажуулалтын хувь =\nverified / дахин аудитлагдсан', ha='center', va='center',
            fontsize=9.5, color=INK, fontweight='bold')
    save(fig, 'fix_verification.png')


def idempotency_sequence():
    """Утас хариугаа алдсан бичилтийг ижил түлхүүрээр дахин илгээхэд сервер нэг л удаа бичнэ."""
    fig, ax = canvas(10, 5.6)
    lanes = [(1.2, 'Утас\n(outbox)'), (5.0, 'API\n(Idempotency-Key)'), (8.8, 'PostgreSQL\nidempotency_keys')]
    for x, name in lanes:
        box(ax, x - 1.0, 4.85, 2.0, 0.65, name, fc=CARD, size=9.5, bold=True)
        ax.plot([x, x], [0.15, 4.85], color=MUTED, lw=1, ls=(0, (4, 3)))

    def msg(x1, x2, y, label, color=INK, dashed=False):
        ax.annotate('', xy=(x2, y), xytext=(x1, y),
                    arrowprops=dict(arrowstyle='-|>', color=color, lw=1.2, ls='--' if dashed else '-'))
        ax.text((x1 + x2) / 2, y + 0.07, label, ha='center', va='bottom', fontsize=8.6, color=color)

    msg(1.2, 5.0, 4.45, 'POST /work-logs/daily  ·  Idempotency-Key: k1')
    msg(5.0, 8.8, 4.05, 'INSERT (user, k1) — unique index')
    msg(8.8, 5.0, 3.7, 'шинэ мөр: эхний хүсэлт', dashed=True)
    msg(5.0, 8.8, 3.3, 'бичилт хийж, хариуг хадгална')
    msg(5.0, 1.2, 2.9, '201 — хариу замдаа алдагдав (timeout)', color=RED, dashed=True)
    ax.text(1.35, 2.45, 'outbox түлхүүртэй нь хадгална', fontsize=8.6, color=AMBER, fontweight='bold')
    msg(1.2, 5.0, 2.0, 'дахин: POST  ·  Idempotency-Key: k1')
    msg(5.0, 8.8, 1.6, 'INSERT (user, k1) → 23505 давхардал')
    msg(8.8, 5.0, 1.25, 'хадгалсан хариу', dashed=True)
    msg(5.0, 1.2, 0.8, '201 + Idempotent-Replayed: true — дахин бичихгүй', color=GREEN, dashed=True)
    save(fig, 'idempotency.png')


if __name__ == '__main__':
    results = read_results()
    after = read_benchmark()
    tests_by_suite(results)
    benchmark_p95(after)
    benchmark_before_after(read_benchmark('benchmark-results.before-cache.json'), after)
    fix_verification()
    idempotency_sequence()
    print('charts ok', results['commit'])
