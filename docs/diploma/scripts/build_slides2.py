# -*- coding: utf-8 -*-
"""II үзлэгийн илтгэл (.pptx): python scripts/make_charts.py && python scripts/build_slides2.py

II үзлэгийн шаардлага: алгоритмын кодчилол, шинжилгээ, туршилт, үр дүн. I үзлэгийн илтгэлтэй ижил загвар
(slides_kit.py). Тестийн тоо, хугацааны хэмжилтийг docs/RESULTS.md, docs/benchmark-results*.json-оос
уншина (make_charts.py); кодын хэсгүүд нь доор заасан файлуудаас товчилж авсан тул тэр файлууд өөрчлөгдвөл
энд ч засна.
"""
import os

from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Cm, Pt

from make_charts import read_benchmark, read_results, read_use_cases
from slides_kit import (AMBER, AUTHOR, CARD, CW, GREEN, GREY, INK, LINE, MONO, MUTED, NAVY, NAVY2, OUTPUT, PALE, RED,
                        SYMBOL, W, H, M, WHITE, YELLOW, add_dark_slide, add_slide, code, label, new_deck, phone,
                        picture, rect, shape_text, table, text)

DATE = '2026.11.03'  # Үзлэгийн өдөр (хуваарь: 11.03–05) тодорхой болмогц солино.

results = read_results()
use_cases = read_use_cases()
bench = read_benchmark()
bench_before = read_benchmark('benchmark-results.before-cache.json')
suites = results['suites']
TOTAL = sum(suite['passed'] for suite in suites.values())
FAILED = sum(suite['failed'] for suite in suites.values())
UC_TESTS = sum(uc['tests'] for uc in use_cases)


def num(value):
    """Мянгатыг зайгаар: 2360 -> '2 360'."""
    return f'{value:,}'.replace(',', ' ')


def p95(data, name):
    return next(row['p95'] for row in data['endpoints'] + data['algorithms'] if row.get('endpoint', row.get('name')) == name)


MONTHLY = 'GET /operations/monthly-report (manager, K1–K6)'
KPI_ALGO = 'K1 + K3 (monthlyMeasurements), 10,000 records'
SCORE_ALGO = 'Audit score (scoreAnswers), 10,000 audits × 10 questions'
SLOWEST = max(row['p95'] for row in bench['endpoints'])

prs = new_deck()

SECTIONS = {
    1: '01 · I үзлэгээс хойших явц',
    2: '02 · Алгоритмын кодчилол',
    3: '03 · Туршилт',
    4: '04 · Үр дүн ба цаашдын ажил',
    0: 'Нэмэлт слайд',
}


def slide(title, section, notes, number=None):
    return add_slide(prs, title, SECTIONS[section], 'Дипломын ажлын II үзлэг · ' + DATE, notes, number)


def dark_slide(notes):
    return add_dark_slide(prs, notes)


def path(s, x, y, w, value):
    """Кодын файлын зам: жижиг, бүдэг, тогтмол өргөнтэй үсгээр."""
    return text(s, x, y, w, Cm(0.5), value, size=9.5, color=MUTED, font=MONO)


def tile(s, x, y, w, h, value, caption, dark=False, value_size=22):
    rect(s, x, y, w, h, NAVY if dark else CARD, radius=Cm(0.2))
    text(s, x + Cm(0.45), y + Cm(0.3), w - Cm(0.9), Cm(1.1), value, size=value_size, bold=True,
         color=YELLOW if dark else NAVY)
    text(s, x + Cm(0.45), y + Cm(0.3) + Cm(value_size * 0.05), w - Cm(0.9), h - Cm(1.5), caption, size=10.5,
         color=PALE if dark else MUTED, line=1.0)


def tiles(s, y, h, items, x=M, w=CW, gap=Cm(0.4), value_size=22):
    """Нэг мөрөнд тэнцүү өргөнтэй хавтангууд; items: (утга, тайлбар[, бараан])."""
    tw = (w - gap * (len(items) - 1)) / len(items)
    for i, item in enumerate(items):
        value, caption = item[:2]
        dark = len(item) > 2 and item[2]
        tile(s, x + int(i * (tw + gap)), y, int(tw), h, value, caption, dark=dark, value_size=value_size)


half_w = (CW - Cm(0.6)) / 2

# --------------------------------------------------------------------------- 1. Нүүр
s = dark_slide('Сайн байна уу. Би Программ хангамжийн инженерчлэлийн оюутан Б.Билгүүн. «Байгууллагын бүтээмжийг '
               'дэмжих платформ хөгжүүлэлт» сэдэвт дипломын ажлын хоёрдугаар үзлэгт алгоритмын кодчилол, туршилт, '
               'үр дүнгээ танилцуулна. Удирдагч багш маань доктор (Ph.D), дэд профессор Г.Ганчимэг.')
rect(s, 0, 0, Cm(0.45), H, YELLOW)
rect(s, Cm(21.2), Cm(12.2), W - Cm(21.2), H - Cm(12.2), NAVY2)
label(s, Cm(1.9), Cm(1.5), Cm(20), 'ШУТИС · МХТС · Компьютерийн ухааны тэнхим', color=YELLOW, size=11)
text(s, Cm(1.9), Cm(2.25), Cm(18), Cm(0.7), 'Бакалаврын дипломын ажил · II үзлэг', size=13, color=PALE)
text(s, Cm(1.9), Cm(4.0), Cm(18), Cm(5.4), ['Байгууллагын', 'бүтээмжийг дэмжих', 'платформ хөгжүүлэлт'],
     size=40, bold=True, color=WHITE, after=0, line=1.0)
text(s, Cm(1.9), Cm(9.35), Cm(17.5), Cm(0.8), 'Алгоритмын кодчилол · туршилт · үр дүн', size=15, color=YELLOW,
     bold=True)
rect(s, Cm(1.9), Cm(12.3), Cm(1.1), Cm(0.13), YELLOW)
text(s, Cm(1.9), Cm(12.75), Cm(18.5), Cm(4.5), [
    [('Гүйцэтгэсэн   ', {'color': PALE}), ('Б.Билгүүн (B190910014)', {'bold': True})],
    [('Удирдагч   ', {'color': PALE}), ('Доктор (Ph.D), дэд профессор Г.Ганчимэг', {'bold': True})],
    [('Мэргэжил   ', {'color': PALE}), ('Программ хангамжийн инженерчлэл · 071405000000002306', {})],
    [('Огноо   ', {'color': PALE}), (DATE + ' · Улаанбаатар', {})],
], size=13, color=WHITE, after=7)
picture(s, 'ui_huddle.png', Cm(19.2), Cm(2.9), Cm(13.3), Cm(8.4), border=NAVY2, valign='top')
phone(s, 'mob_today.png', Cm(27.9), Cm(7.9), Cm(9.9))

# --------------------------------------------------------------------------- 2. Агуулга
s = slide('Агуулга', 1, 'Илтгэл дөрвөн хэсэгтэй: I үзлэгээс хойш хийсэн ажил, алгоритмын кодчилол, туршилт, үр дүн ба '
          'цаашдын ажил. Баруун талд хоёрдугаар үзлэгийн шаардлага бүр аль слайдад байгааг харууллаа.')
parts = [('01', 'I үзлэгээс хойших явц', 'Хийсэн ажил · төлөвлөгөөний биелэлт · зохиомжоос код руу'),
         ('02', 'Алгоритмын кодчилол', 'Аудитын оноо · K1–K6 · PDCA шалгалт · сүлжээгүй горим · аюулгүй байдал'),
         ('03', 'Туршилт', 'Тестийн стратеги · 22 use-case-ийн хүлээн авах тест · тестээр олдсон алдаа'),
         ('04', 'Үр дүн ба цаашдын ажил', 'Гүйцэтгэлийн хэмжилт · ISO/IEC 25010 · мөрдөх матриц · демо · III үзлэг')]
for i, (n, head, sub) in enumerate(parts):
    y = Cm(3.9 + i * 3.4)
    badge = rect(s, M, y, Cm(1.6), Cm(1.6), YELLOW if i == 0 else NAVY)
    shape_text(badge, n, size=18, bold=True, color=NAVY if i == 0 else WHITE)
    text(s, M + Cm(2.2), y + Cm(0.05), Cm(15.6), Cm(0.9), head, size=20, bold=True, color=INK)
    text(s, M + Cm(2.2), y + Cm(0.95), Cm(15.6), Cm(1.4), sub, size=12.5, color=MUTED)
card_x, card_w = Cm(20.3), W - M - Cm(20.3)
rect(s, card_x, Cm(3.9), card_w, Cm(13.5), NAVY, radius=Cm(0.3))
label(s, card_x + Cm(0.8), Cm(4.55), card_w - Cm(1.6), 'II үзлэгийн шаардлага', color=YELLOW)
checks = [('I үзлэгийн төлөвлөгөөний биелэлт', '3'), ('Алгоритмын кодчилол (бодит код)', '4–9'),
          ('Шинжилгээ: төвөгшил, хэмжилт', '5–9, 14'), ('Туршилтын стратеги, use-case тест', '10–12'),
          ('Гүйцэтгэлийн хэмжилт (NFR-06)', '13–14'), ('Үр дүн: ISO 25010, матриц, дэлгэц', '15–17'),
          ('Ажиллаж буй системийн демо', '18'), ('III үзлэгийн төлөвлөгөө', '19')]
for i, (item, pages) in enumerate(checks):
    y = Cm(5.55 + i * 1.44)
    text(s, card_x + Cm(0.8), y, Cm(0.8), Cm(0.8), '✓', size=15, bold=True, color=YELLOW, font=SYMBOL)
    text(s, card_x + Cm(1.6), y + Cm(0.03), card_w - Cm(4.0), Cm(0.8), item, size=13.5, color=WHITE)
    text(s, card_x + card_w - Cm(2.4), y + Cm(0.03), Cm(1.6), Cm(0.8), pages, size=13, color=PALE,
         align=PP_ALIGN.RIGHT)

# --------------------------------------------------------------------------- 3. Хийсэн ажил
s = slide('I үзлэгээс хойш хийсэн ажил', 1,
          'I үзлэгээс хойш хоёр том хэсэг ажил хийж main салбарт нэгтгэсэн: 36 commit, 49 migration, 29 хүснэгт. '
          'Тестийн тоо 2 124-өөс %s болсон. I үзлэгт амласан гурван зүйлээс KPI самбар бүрэн хийгдсэн. Серверт '
          'байршуулалтыг Docker Compose-ийн production stack-ийг бүтэн ажиллуулж шалгасан ч нийтийн сервер дээр '
          'хараахан тавиагүй. Хэрэглэгчийн судалгаа хийгдээгүй, III үзлэгээс өмнө авна.' % num(TOTAL))
tiles(s, Cm(3.65), Cm(2.3), [('36', 'commit · 2 pull request'), ('38 → 49', 'migration'), ('25 → 29', 'хүснэгт'),
                             ('2 124 → ' + num(TOTAL), 'автомат тест, 0 унасан', True)], value_size=20)
groups = [('Бүртгэл ба аюулгүй байдал', ['Нууц үг сэргээх, урилга хүлээн авах', 'CSV / Excel-ээс бөөнөөр урих',
                                         'Refresh токен HttpOnly cookie-д', 'Нууц үг солиход бусад session дуусна']),
          ('5S ба PDCA', ['Бүсийн хүснэгт, мөр бүрд QR, монгол шалгах хуудас', 'Засварыг дараагийн аудитаар шалгах',
                          'Үндсэн шалтгаан, менежерийн баталгаажуулалт']),
          ('Тайлан ба хэмжүүр', ['K2, K4, K6 нэмэгдэж K1–K6 бүрэн', 'Хаасан сарыг шалтгаантай дахин нээх, түүх',
                                 'Өглөөний хуралд эрсдэлтэй ажил, тайлан бичээгүй хүн']),
          ('Гар утас ба чанар', ['«Өнөөдөр» таб, Idempotency-Key', 'UC-01…UC-22 хүлээн авах тест, benchmark',
                                 'Вэбийн эхний ачаалал 1 541 → 642 kB'])]
gw = (Cm(20.0) - Cm(0.5)) / 2
for i, (head, items) in enumerate(groups):
    x = M + int((i % 2) * (gw + Cm(0.5)))
    y = Cm(6.4 + (i // 2) * 5.65)
    rect(s, x, y, int(gw), Cm(5.3), CARD, radius=Cm(0.2))
    text(s, x + Cm(0.5), y + Cm(0.35), int(gw) - Cm(1.0), Cm(0.7), head, size=14.5, bold=True, color=NAVY)
    text(s, x + Cm(0.5), y + Cm(1.2), int(gw) - Cm(1.0), Cm(3.9), ['•  ' + t for t in items], size=12.5, after=5)
x = Cm(22.1)
w = W - M - x
rect(s, x, Cm(6.4), w, Cm(10.95), NAVY, radius=Cm(0.3))
label(s, x + Cm(0.7), Cm(6.95), w - Cm(1.4), 'I үзлэгт төлөвлөсөн → биелэлт', color=YELLOW)
promises = [('✓', GREEN, 'KPI самбар (FR-22)', 'K1–K6 сарын тайланд, нотлох бичлэгтэй'),
            ('✓', GREEN, 'Алгоритмын кодчилол, тест', '22 UC, %s тест' % num(TOTAL)),
            ('∼', AMBER, 'Серверт байршуулалт', 'Production stack-ийг бүтэн ажиллуулж шалгасан; нийтийн сервер үгүй'),
            ('–', GREY, 'Хэрэглэгчийн судалгаа', 'Хийгдээгүй — III үзлэгээс өмнө')]
for i, (mark, colour, head, body) in enumerate(promises):
    y = Cm(7.85 + i * 2.35)
    text(s, x + Cm(0.7), y, Cm(0.8), Cm(0.8), mark, size=16, bold=True, color=YELLOW if mark == '✓' else PALE,
         font=SYMBOL)
    text(s, x + Cm(1.6), y + Cm(0.02), w - Cm(2.2), Cm(0.7), head, size=13.5, bold=True, color=WHITE)
    text(s, x + Cm(1.6), y + Cm(0.75), w - Cm(2.2), Cm(1.4), body, size=11, color=PALE, line=1.0)

# --------------------------------------------------------------------------- 4. Зохиомжоос код руу
s = slide('Зохиомжоос код руу: алгоритм хаана хэрэгжсэн', 1,
          'Систем гурван хэсэгтэй: NestJS дээрх API, React вэб, Flutter гар утас; тестийг оруулалгүй 65 мянга орчим мөр '
          'код. I үзлэгт зохиомжилсон алгоритм бүр кодын тодорхой нэг газарт, цэвэр функц эсвэл үйлчилгээ болж '
          'хэрэгжсэн, тус бүр өөрийн unit тесттэй. Дараагийн слайдуудад эдгээрийг нэг нэгээр нь бодит кодоор нь '
          'үзүүлнэ.')
label(s, M, Cm(3.7), Cm(12), 'Хэрэгжүүлэлт')
impl = [['Хэсэг', 'Технологи', 'Код, мөр', 'Тест'],
        ['API', 'NestJS 11 · TypeORM · PostgreSQL', '17 324', num(suites['backend']['passed'] + suites['uc']['passed'])],
        ['Вэб', 'React 18 · Vite · Tailwind', '40 557', num(suites['web']['passed'] + suites['e2e']['passed'])],
        ['Гар утас', 'Flutter · Dio · Provider', '7 164', num(suites['mobile']['passed'])],
        ['Өгөгдөл', '29 хүснэгт · 49 migration', '—', '—']]
table(s, M, Cm(4.4), [Cm(2.6), Cm(6.9), Cm(2.4), Cm(1.9)], impl, size=12, row_h=Cm(1.0),
      align={2: PP_ALIGN.RIGHT, 3: PP_ALIGN.RIGHT}, bold_cols=(0,))
text(s, M, Cm(9.6), Cm(13.8), Cm(1.4), 'Код, мөр: тест ба migration-ийг оруулаагүй .ts, .tsx, .dart файл. Тест: '
     'backend-д use-case, вэбд e2e-г нэмсэн.', size=10.5, color=MUTED)
rect(s, M, Cm(11.6), Cm(13.8), Cm(5.9), NAVY, radius=Cm(0.25))
label(s, M + Cm(0.6), Cm(12.1), Cm(12.6), 'Дүрэм', color=YELLOW)
text(s, M + Cm(0.6), Cm(12.8), Cm(12.6), Cm(4.5),
     ['•  Тооцоо цэвэр функцэд: өгөгдлийн сангүйгээр тестлэгдэнэ',
      '•  Шийдвэрийн оноог сервер хариултаас дахин тооцно',
      '•  Өгөгдөлгүйг 0 гэж харуулахгүй: null ба хасагдсан тоо',
      '•  Огноог байгууллагын цагийн бүсээр (Asia/Ulaanbaatar)'], size=12.5, color=WHITE, after=7)
x = M + Cm(14.4)
w = W - M - x
label(s, x, Cm(3.7), w, 'Алгоритм → код')
algos = [['Алгоритм', 'Файл · функц', 'Слайд'],
         ['Аудитын оноо', 'backend/…/audit-score.ts · scoreFromAnswers()\nвэб, утас: scoreAnswers() ижил дүрмээр', '5'],
         ['Засах ажил үүсгэх', 'backend/…/operations.service.ts\ncorrectiveWorkFor()', '5'],
         ['K1–K6 үзүүлэлт', 'backend/…/monthly-measurements.ts\nmonthlyMeasurements(), lateWork()', '6'],
         ['PDCA «Шалгах»', 'backend/…/improvement-verification.ts\nverifyImprovements()', '7'],
         ['Сүлжээгүй дараалал', 'mobile-flutter/lib/services/outbox.dart\nOutbox.flush()', '8'],
         ['Idempotency-Key', 'backend/src/shared/idempotency/\nIdempotencyService.claim()', '8'],
         ['Нууц үг сэргээх', 'backend/src/users/users.service.ts\ncompletePasswordReset()', '9']]
table(s, x, Cm(4.4), [Cm(4.3), w - Cm(4.3) - Cm(2.0), Cm(2.0)], algos, size=11,
      heights=[Cm(0.9)] + [Cm(1.6)] * 7, bold_cols=(0,), align={2: PP_ALIGN.CENTER})

# --------------------------------------------------------------------------- 5. Аудитын оноо
s = slide('Алгоритм 1: аудитын оноо ба засах ажил', 2,
          'Аудитын оноо = авсан онооны нийлбэр / боломжит онооны нийлбэр × 100. Хариулаагүй асуулт 0, текст хариулт '
          'нотолгоо тул оноонд орохгүй. Оноо 85-аас доош бол сервер бүсийн хариуцагчид 7 хоногийн хугацаатай засах '
          'ажил үүсгэнэ, 70-аас доош бол өндөр ач холбогдолтой. Ажил аудитаараа эх сурвалжтай тул нэг аудитаас нээлттэй '
          'хоёр ажил үүсэхгүй. Вэб, утас оноог бөглөх явцад харуулдаг ч шийдвэр гаргах оноог сервер хариултаас дахин '
          'тооцно; клиентээс ирсэн оноог тооцохгүй тул хуурамч оноогоор засах ажлаас зайлсхийх боломжгүй. Төвөгшил '
          'асуултын тоогоор O(n); 10 000 аудитыг 10 асуулттайгаар 2.4 мс-д бодно.')
cw2 = (CW - Cm(0.6)) / 2
label(s, M, Cm(3.65), cw2, 'Оноо тооцох · сервер (товчилсон)')
path(s, M, Cm(4.25), cw2, 'backend/src/operations/audit-score.ts')
code(s, M, Cm(4.85), int(cw2), Cm(9.1), '''
export const scoreFromAnswers = (questions, answers) => {
  const given = new Map(answers.map((a) => [a.questionId, a.value]));
  let earned = 0;
  let possible = 0;
  for (const question of questions ?? []) {
    const value = given.get(question.id);
    if (question.type === 'score') {
      const outOf = question.maxScore || DEFAULT_MAX_SCORE;
      possible += outOf;
      earned += clamp(Number(value), 0, outOf);  // хүрээнд барина
    }
    if (question.type === 'yes_no') {
      possible += 1;
      earned += value === true || value === 'yes' ? 1 : 0;
    }
  }                                  // текст: нотолгоо, оноо биш
  return possible ? Math.round((earned / possible) * 100) : null;
};
''', size=10.5)
x = M + int(cw2 + Cm(0.6))
label(s, x, Cm(3.65), cw2, 'Засах ажил · сервер (товчилсон)')
path(s, x, Cm(4.25), cw2, 'backend/src/operations/operations.service.ts')
code(s, x, Cm(4.85), int(cw2), Cm(9.1), '''
private async correctiveWorkFor(run, user) {
  const score = Number(run.score) || 0;
  if (run.status === 'draft' || score >= PASSING_SCORE) {
    return null;                              // 85: тэнцсэн
  }
  const zone = /* аудит хийсэн бүс */;
  return this.createTask({    // давхардлыг шалгана
    title: `5S follow-up: ${place}`,
    assigneeId: zone?.ownerId,                // бүсийн хариуцагч
    sourceType: TaskSource.AUDIT_RUN,
    sourceId: run.id,
    priority: score < URGENT_SCORE ? 'high' : 'medium',  // 70
    dueDate,                                  // өнөөдөр + 7 хоног
  }, user);
}
''', size=10.5)
tiles(s, Cm(14.4), Cm(3.1), [('O(n)', 'n — шалгах хуудасны асуултын тоо'),
                             ('%.1f мс' % p95(bench, SCORE_ALGO), 'p95 · 10 000 аудит × 10 асуулт'),
                             ('1 ажил', 'нэг аудитаас: (sourceType, sourceId) хосоор давхардлыг шалгана'),
                             ('UC-08 ✓', 'аудит → оноо → засах ажил оноогдож мэдэгдэл очно', True)], value_size=20)

# --------------------------------------------------------------------------- 6. K1–K6
s = slide('Алгоритм 2: бүтээмжийн үзүүлэлт K1–K6', 2,
          'Сарын тайлан зургаан үзүүлэлтийг ажил, аудит, долоо хоногийн тайлангийн бичлэгээс тооцно. Үр дүн бүр нэг '
          'хэлбэртэй: утга, тоологч, хуваарь, хасагдсан бичлэгийн тоо. Өгөгдөл байхгүй бол утга null, 0 биш. Огноог '
          'байгууллагын цагийн бүсээр харьцуулна. Жишээ нь K2 хоцорсон ажлыг сарын сүүлийн өдрөөр, сар үргэлжилж '
          'байвал өнөөдрөөр тооцно. K2, K4, K6-ийн бичлэгүүд тайлан болон CSV-д нотолгоо болж гарна. 10 000 бүртгэл '
          'дээр K1 ба K3-ыг 19 мс-д тооцно.')
kpi = [['Код', 'Үзүүлэлт', 'Утга = тоологч / хуваарь', 'Хасагдана'],
       ['K1', 'Хугацаандаа\nгүйцэтгэл', 'хугацаандаа дууссан / огноотой дууссан ажил, %', 'огноо дутуу'],
       ['K2', 'Хоцорсон ажил', 'хоцорсон хоногийн нийлбэр / хоцорсон ажил', 'буруу огноо;\nдууссан ч огноогүй'],
       ['K3', '5S түвшин', 'хүчинтэй онооны нийлбэр / бүстэй аудит', 'ноорог, 0–100-аас гадуур'],
       ['K4', 'Засварын хаалт', 'Σ(дууссан − үүссэн) / аудитаас үүссэн ажил, хоног', 'дараалал буруу'],
       ['K6', 'Долоо хоногийн\nтайлан', 'бичсэн хүн-долоо хоног / хүлээгдэх хүн × долоо хоног', 'хүлээгдээгүй хүн'],
       ['K5, K7', 'Тайлангийн цаг, SUS', 'системээс бус: ажиглалт, асуулга (III үзлэг)', '—']]
table(s, M, Cm(3.7), [Cm(1.7), Cm(3.6), Cm(7.3), Cm(4.2)], kpi, size=11,
      heights=[Cm(0.85)] + [Cm(1.45)] * 6, bold_cols=(0,), align={0: PP_ALIGN.CENTER})
x = M + Cm(17.4)
w = W - M - x
label(s, x, Cm(3.65), w, 'K2 хоцорсон ажил (товчилсон)')
path(s, x, Cm(4.25), w, 'backend/src/operations/monthly-measurements.ts')
code(s, x, Cm(4.85), w, Cm(8.9), '''
export const lateWork = (candidates, referenceDay, tz) => {
  let totalDays = 0, excluded = 0; const evidence = [];
  for (const task of candidates) {
    if (task.status === 'backlog' || !task.dueDate) continue;
    const due = calendarDay(task.dueDate, tz);
    if (!due) { excluded += 1; continue; }    // буруу огноо
    if (due >= referenceDay) continue;        // хугацаа болоогүй
    const finished = calendarDay(task.completedAt, tz);
    if (finished && finished <= referenceDay) continue;
    if (!finished && task.status === 'done') {
      excluded += 1; continue;                // огноогүй
    }
    const days = daysBetween(due, referenceDay);
    totalDays += days;
    evidence.push({ id: task.id, title: task.title, days });
  }
  const measurement =
    meanDays(totalDays, evidence.length, excluded);
  return { measurement, evidence };
};
''', size=9.5)
tiles(s, Cm(14.1), Cm(2.75), [('{ value | null, … }', 'numerator · denominator · excluded'),
                               ('null ≠ 0', 'өгөгдөлгүйг хэмжсэн 0 гэж харуулахгүй')],
      x=M, w=Cm(16.8), value_size=15)
tiles(s, Cm(14.1), Cm(2.75), [('O(n + m + p·w)', 'n ажил, m аудит, p хүн, w долоо хоног'),
                               ('%.1f мс' % p95(bench, KPI_ALGO), 'p95 · K1 + K3, 10 000 бүртгэл', True)],
      x=x, w=w, value_size=15)

# --------------------------------------------------------------------------- 7. PDCA
s = slide('Алгоритм 3: PDCA «Шалгах» — засварын үр дүн', 2,
          'I үзлэгт PDCA-ийн хамгийн сул холбоос нь «Сайжруулах» алхмын үр дүнг дахин хэмжих гэж дүгнэсэн. Засах ажил '
          'хаагдсан нь асуудал арилсан гэсэн үг биш. Нотолгоо нь тухайн бүсийн дараагийн аудит. Засвар бүрийг зургаан '
          'төлөвийн аль нэгэнд ангилж, баталгаажуулалтын хувийг verified / дахин аудитлагдсан гэж тооцно. Үүн дээр '
          'засвар хийсэн хүн үндсэн шалтгааныг бичиж, менежер баталгаажуулна. Өөрийнхөө засварыг баталгаажуулж '
          'болохгүй.')
picture(s, 'fix_verification.png', M, Cm(3.55), Cm(18.0), Cm(8.2), valign='top')
rect(s, M, Cm(12.15), Cm(18.0), Cm(5.35), CARD, radius=Cm(0.2))
label(s, M + Cm(0.5), Cm(12.5), Cm(17), 'Залруулах үйлдлийн гогцоо бүрэн')
text(s, M + Cm(0.5), Cm(13.2), Cm(17.0), Cm(4.2),
     [[('Үндсэн шалтгаан  ', {'bold': True, 'color': NAVY}), ('засвар хийсэн ажилтан эсвэл менежер бичнэ', {})],
      [('Баталгаажуулалт  ', {'bold': True, 'color': NAVY}),
       ('POST /tasks/:id/sign-off, эрх fixes:signoff; өөрийн засварт татгалзана, дахин нээвэл цуцлагдана', {})],
      [('Үр дүн  ', {'bold': True, 'color': NAVY}),
       ('зөвхөн дараагийн аудит засвар ажилласан эсэхийг шийднэ; вэб: 5S → Үр дүн', {})]], size=12, after=6)
x = M + Cm(18.6)
w = W - M - x
label(s, x, Cm(3.65), w, 'Ангилал (товчилсон)')
path(s, x, Cm(4.25), w, 'backend/src/operations/improvement-verification.ts')
code(s, x, Cm(4.85), w, Cm(8.3), '''
for (const task of tasks) {
  if (task.sourceType !== 'audit_run') continue;
  const trigger = runById.get(task.sourceId);
  if (task.status !== 'done') { push('open'); continue; }
  const closedAt = time(task.completedAt);
  if (closedAt === undefined) {
    push('done_undated'); continue;
  }
  const next = byZone.get(trigger.zoneId)?.find(
    (e) => e.at > closedAt && e.run.id !== trigger.id);
  if (!next) { push('awaiting_reaudit'); continue; }
  push(next.score >= VERIFICATION_STANDARD    // 85
    ? 'verified'
    : next.score > triggerScore
      ? 'improved' : 'not_improved');
}
''', size=9.5)
tiles(s, Cm(13.6), Cm(3.9), [('O(r log r + t·k)', 'r аудит, t засвар, k бүсийн аудит'),
                             ('UC-14 ✓', 'дараагийн аудитаар шалгах; шалтгаан ба баталгаажуулалт', True)],
      x=x, w=w, value_size=15)

# --------------------------------------------------------------------------- 8. Сүлжээгүй горим + Idempotency
s = slide('Алгоритм 4: офлайн горим ба давхардалгүй бичилт', 2,
          'I үзлэгт timeout болсон хүсэлтийг дахин илгээхгүй гэж зохиомжилсон: сервер бичсэн байж магадгүй тул '
          'аудит давхар тоологдох эрсдэлтэй. Харин ингэвэл хариу нь алдагдсан бүртгэл утсанд алга болдог байсан. '
          'Одоо утас хадгалсан өөрчлөлт бүрд түлхүүр өгч, Idempotency-Key толгойгоор илгээнэ. Сервер (хэрэглэгч, '
          'түлхүүр) хосыг давтагдашгүй индексээр эзэлнэ. Дахин ирсэн хүсэлт шинээр бичигдэхгүй, анхны хариугаа '
          'авна. Ингэснээр timeout-ыг ч аюулгүй дахин илгээнэ.')
picture(s, 'idempotency.png', M, Cm(3.55), Cm(16.0), Cm(8.8), valign='top')
text(s, M, Cm(12.55), Cm(16.0), Cm(2.0),
     [[('Утас: ', {'bold': True, 'color': NAVY}),
       ('хийсэн дарааллаар илгээнэ; холболтгүй, 5xx, 401, давхар хүсэлт боловсруулагдаж байвал хадгалж, дараа дахин '
        'оролдоно; бусад 4xx-ийг хасаж мэдэгдэнэ.', {})]], size=12)
tiles(s, Cm(14.7), Cm(2.8), [('11 / 11', 'outbox тест: офлайн, апп хаагдах, дараалал, timeout'),
                             ('24 цаг', 'түлхүүрийн хадгалах хугацаа'),
                             ('UC-02 ✓', 'хариугаа алдсан бүртгэл нэг л удаа хадгалагдана', True)],
      x=M, w=Cm(16.0), gap=Cm(0.3), value_size=17)
x = M + Cm(16.6)
w = W - M - x
label(s, x, Cm(3.65), w, 'Утас: дараалал илгээх')
path(s, x, Cm(4.25), w, 'mobile-flutter/lib/services/outbox.dart')
code(s, x, Cm(4.85), w, Cm(5.0), '''
await _api.send(next.method, next.path, next.data,
    idempotencyKey: next.key);
...
if (status == null || status >= 500 || status == 401 ||
    errorCodeOf(error) == 'REQUEST_IN_PROGRESS') {
  break;                  // хадгалаад дараа дахин
}
refused++;                // 4xx: дахин илгээх утгагүй
''', size=9.5)
label(s, x, Cm(10.2), w, 'Сервер: түлхүүрийг эзлэх (товчилсон)')
path(s, x, Cm(10.8), w, 'backend/src/shared/idempotency/idempotency.service.ts')
code(s, x, Cm(11.4), w, Cm(6.1), '''
try {
  const row = await this.keys.save({ userId, key, target });
  return { claimed: true, id: row.id };       // эхний хүсэлт
} catch (error) {
  if (!isUniqueViolation(error)) throw error; // 23505
}
const existing = await this.keys.findOne({ where: { userId, key } });
if (existing.target !== target) throw IdempotencyKeyReused;  // 409
if (existing.statusCode == null) throw RequestInProgress;    // 409
return { claimed: false, statusCode, response };  // анхны хариу
''', size=9.5)

# --------------------------------------------------------------------------- 9. Аюулгүй байдал
s = slide('Алгоритм 5: нэвтрэлт ба бүртгэлийн аюулгүй байдал', 2,
          'Нууц үг сэргээх урсгал бол халдлагад хамгийн өртөмтгий хэсэг. Токены зөвхөн hash-ийг хадгална, токен нэг '
          'удаа хүчинтэй. Нэг токентой зэрэг ирсэн хоёр хүсэлтээс нэг л амжина, учир нь хэрэглэх нь нөхцөлтэй UPDATE. '
          'Хариу нь бүртгэл байгаа эсэхийг агуулгаараа ч, хугацаагаараа ч илэрхийлэхгүй. Нууц үг солих, сэргээхэд token_version '
          'нэмэгдэж бусад бүх session дуусна. Вэбийн refresh токен HttpOnly cookie-д шилжсэн тул script уншиж чадахгүй.')
sec = [['Механизм', 'Хэрэгжүүлэлт', 'Шалгалт'],
       ['Сэргээх токен', 'зөвхөн hash; нэг удаа; нөхцөлтэй UPDATE-ээр атомаар', '13 халдлагын\nтохиолдол'],
       ['Хаяг задруулахгүй', 'мэдэгдэхгүй, идэвхгүй, бүртгэлтэй хаягт ижил хариу; мэйлээс өмнө хариулна',
        'enumeration,\ntiming'],
       ['Session дуусгах', 'token_version + 1 → хуучин refresh токен 401', 'UC-07'],
       ['Refresh токен (вэб)', 'HttpOnly, SameSite=Strict cookie, Path=/api/auth', 'UC-07'],
       ['Хүсэлтийн хязгаар', 'нууц үг мартсан: 5/мин, сэргээх: 10/мин', 'rate-limit тест'],
       ['Эрх', 'сервер талд дүрээр; бусдын ажил ажилтанд «олдсонгүй»', '15 татгалзах тест']]
table(s, M, Cm(3.7), [Cm(4.0), Cm(9.6), Cm(3.4)], sec, size=11.5, heights=[Cm(0.85)] + [Cm(1.6)] * 6,
      bold_cols=(0,))
x = M + Cm(17.6)
w = W - M - x
label(s, x, Cm(3.65), w, 'Токеныг атомаар хэрэглэх')
path(s, x, Cm(4.25), w, 'backend/src/users/users.service.ts')
code(s, x, Cm(4.85), w, Cm(5.9), '''
async completePasswordReset(userId, tokenHash, newPassword) {
  const result = await this.usersRepository.update(
    { id: userId, resetPasswordToken: tokenHash,
      resetPasswordExpires: MoreThan(new Date()) },
    { password: await bcrypt.hash(newPassword, 10),
      resetPasswordToken: null,
      resetPasswordExpires: null,
      // бусад бүх session-ийн refresh токен хүчингүй болно
      tokenVersion: () => 'token_version + 1' });
  return (result.affected ?? 0) === 1;  // зэрэг 2-оос 1 л
}
''', size=9.5)
tiles(s, Cm(11.25), Cm(2.6), [('13 / 13', 'нууц үг сэргээлтийн халдлагын тохиолдол'),
                              ('15 / 15', 'эрхийн матриц: татгалзах ёстой үйлдэл', True)], x=x, w=w, value_size=18)
text(s, x, Cm(14.4), w, Cm(2.3), 'Үлдсэн ажил: вэбийн 1 цагийн хандалтын токен localStorage-д хэвээр, санах ойд '
     'шилжүүлэх нь дараагийн алхам.', size=11, color=MUTED)

# --------------------------------------------------------------------------- 10. Туршилтын стратеги
s = slide('Туршилтын стратеги ба тестийн тоо', 3,
          'Тестийг зургаан түвшинд бичсэн. Алгоритмуудыг unit тестээр, API-г HTTP тестээр, use-case бүрийг бодит '
          'PostgreSQL дээрх хүлээн авах тестээр, хөтчийн урсгал ба WCAG хүртээмжийг Playwright, axe-аар шалгана. '
          'I үзлэгээс хойш use-case-ийн хүлээн авах тест шинээр нэмэгдсэн. Нийт %s тест, 0 унасан. Үр дүнгийн '
          'хүснэгт RESULTS.md-г `npm run results` бодит тестийн гаралтаас автоматаар үүсгэдэг, гараар бичдэггүй.'
          % num(TOTAL))
picture(s, 'tests_by_suite.png', M, Cm(3.55), Cm(17.2), Cm(9.6), valign='top')
x = M + Cm(17.8)
w = W - M - x
levels = [['Түвшин', 'Хэрэгсэл', 'Юуг шалгана'],
          ['Unit', 'Jest · Vitest\nflutter_test', 'оноо, K1–K6, PDCA,\noutbox'],
          ['HTTP', 'Jest + supertest', 'маршрут, guard, validation'],
          ['Use-case', 'Jest + PostgreSQL', '22 UC: үндсэн ба өөр урсгал'],
          ['Component', 'Vitest + Testing Library', 'вэб хуудас, орчуулга'],
          ['E2E', 'Playwright + axe', 'хөтчийн урсгал, WCAG 2.1 AA'],
          ['Гар утас', 'flutter_test', 'дэлгэц, outbox, том үсэг']]
table(s, x, Cm(3.7), [Cm(2.7), Cm(4.3), w - Cm(7.0)], levels, size=11, heights=[Cm(0.85)] + [Cm(1.5)] * 6,
      bold_cols=(0,))
box = rect(s, M, Cm(14.6), CW, Cm(2.9), NAVY, radius=Cm(0.25))
shape_text(box, [[('НИЙТ   ', {'color': YELLOW, 'size': 12, 'spacing': 1.2}),
                  ('%s тест · %d унасан · lint цэвэр · push бүрт GitHub Actions' % (num(TOTAL), FAILED), {})],
                 [('RESULTS.md-г `npm run results` автоматаар үүсгэнэ (commit %s, %s)' %
                   (results['commit'], results['date'].replace('-', '.')), {'size': 12, 'color': PALE,
                                                                             'bold': False})]],
           size=17, bold=True, color=WHITE, align=PP_ALIGN.LEFT)

# --------------------------------------------------------------------------- 11. Use-case тест
s = slide('Use-case бүрийн хүлээн авах тест: %d / %d' % (results['uc_passed'], results['uc_total']), 3,
          'Use-case бүрт хүлээн авах тест бичсэн. Тест бүр жинхэнэ аппликейшныг бүх модуль, guard, validation-тай '
          'нь бодит PostgreSQL дээр асааж, HTTP API-аар шалгана. Use-case бүрт үндсэн урсгал, мөн өөр эсвэл '
          'татгалзсан урсгал бий. Нийт %d тест, бүгд давсан.' % UC_TESTS)
cols, gap = 5, Cm(0.3)
tw = (CW - gap * (cols - 1)) / cols
th = Cm(2.4)
for i, uc in enumerate(use_cases):
    x = M + int((i % cols) * (tw + gap))
    y = Cm(3.6) + int((i // cols) * (th + Cm(0.22)))
    ok = uc['result'] == 'pass'
    rect(s, x, y, int(tw), th, CARD, radius=Cm(0.15))
    text(s, x + Cm(0.35), y + Cm(0.25), Cm(2.4), Cm(0.6), uc['id'], size=11, bold=True, color=NAVY)
    text(s, x + int(tw) - Cm(2.0), y + Cm(0.25), Cm(1.65), Cm(0.6),
         [[('✓ ' if ok else '✗ ', {'font': SYMBOL}), (str(uc['tests']), {})]], size=11, bold=True,
         color=GREEN if ok else RED, align=PP_ALIGN.RIGHT)
    text(s, x + Cm(0.35), y + Cm(0.9), int(tw) - Cm(0.7), Cm(1.4), uc['name'], size=11, color=INK, line=1.0)
i = len(use_cases)
x = M + int((i % cols) * (tw + gap))
y = Cm(3.6) + int((i // cols) * (th + Cm(0.22)))
box = rect(s, x, y, W - M - x, th, NAVY, radius=Cm(0.15))
shape_text(box, [[('%d / %d use-case · %d тест' % (results['uc_passed'], results['uc_total'], UC_TESTS),
                   {'bold': True, 'size': 15, 'color': YELLOW})],
                 [('бодит апп + PostgreSQL, HTTP API-аар · үндсэн ба өөр/татгалзсан урсгал', {'size': 11})]],
           color=WHITE, align=PP_ALIGN.LEFT)

# --------------------------------------------------------------------------- 12. Олдсон алдаа
s = slide('Тестээр олдож засагдсан алдаа', 3,
          'Тест ба хэмжилт хэд хэдэн жинхэнэ алдаа илрүүлсэн. Хамгийн чухал нь гүйцэтгэлийн хэмжилтээр олдсон сарын '
          'тайлангийн гацаа: p95 1.75 секунд байсан нь 2 секундын босгод ойртож байв. Үүнийг 14-р слайдад '
          'дэлгэрүүлнэ. Мөн үе үе унадаг байсан e2e тестийн шалтгаан нь байгууллагын тохиргоо дарагддаг алдаа '
          'байсныг олж зассан.')
bugs = [['Алдаа', 'Хэрхэн олдсон', 'Засвар'],
        ['Сарын тайлан p95 1.75 с, max 2.3 с (NFR-06-д ойр)', 'benchmark', 'Intl.DateTimeFormat-ыг цагийн бүсээр кэшлэв → 185 мс'],
        ['Үл мэдэгдэх шалгах хуудсаар аудит → 500', 'UC-08 татгалзсан урсгал', '404 «олдсонгүй» гэж хариулна'],
        ['Нэг тохиргоо хадгалахад бусад нь дарагдана (lost update)', 'live e2e үе үе унана', 'тохиргоог түлхүүр тус бүрээр нийлүүлнэ'],
        ['Хариу нь timeout болсон өдрийн бүртгэл утсанд алдагдана', 'outbox тест', 'Idempotency-Key + outbox-д хадгална'],
        ['Огноогүй дууссан засвар «нээлттэй» гэж тоологдоно', 'PDCA unit тест', 'done_undated төлөв, хувьд оруулахгүй'],
        ['Бараан горимд товч уншигдахгүй; хүснэгт keyboard-оор гүйхгүй', 'axe (Playwright)', 'контраст ба tabindex засав'],
        ['Шинэ migration-ийн нэр glob-д таарахгүй', 'тест (бодит PostgreSQL)', 'нэрийг засав']]
table(s, M, Cm(3.7), [Cm(13.2), Cm(6.0), CW - Cm(19.2)], bugs, size=12, heights=[Cm(0.9)] + [Cm(1.4)] * 7,
      bold_cols=(0,))
box = rect(s, M, Cm(15.2), CW, Cm(2.3), NAVY, radius=Cm(0.25))
shape_text(box, [[('ДҮГНЭЛТ   ', {'color': YELLOW, 'size': 12, 'bold': True}),
                  ('Тест зөвхөн баталгаа биш: долоон жинхэнэ алдааг хэрэглэгчид хүрэхээс өмнө илрүүлсэн.', {})]], size=14, color=WHITE, align=PP_ALIGN.LEFT)

# --------------------------------------------------------------------------- 13. Benchmark
s = slide('Гүйцэтгэлийн хэмжилт: NFR-06 «гол хуудас < 2 секунд»', 4,
          'NFR-06-г шалгахын тулд 50 хэрэглэгч, 10 000 бүртгэлтэй (4 000 ажил, 4 000 ажлын бүртгэл, 2 000 аудит) '
          'сан үүсгэж, endpoint бүрт 20 халаах, дараа нь 200 дараалсан хүсэлт илгээж хугацааг хэмжсэн. Хамгийн удаан '
          'нь тайлангийн CSV, p95 нь %.0f мс; босго 2 000 мс. Клиент сервер нэг машин дээр байсан тул сүлжээний '
          'саатал ороогүй, энэ нь хязгаарлалт.' % SLOWEST)
picture(s, 'bench_p95.png', M, Cm(3.55), Cm(19.8), Cm(10.2), valign='top')
x = M + Cm(20.4)
w = W - M - x
rect(s, x, Cm(3.7), w, Cm(10.0), CARD, radius=Cm(0.25))
label(s, x + Cm(0.6), Cm(4.25), w - Cm(1.2), 'Туршилтын нөхцөл')
ds = bench['dataset']
mc = bench['machine']
text(s, x + Cm(0.6), Cm(4.95), w - Cm(1.2), Cm(8.6),
     [[('Өгөгдөл: ', {'bold': True}), ('%d хэрэглэгч, %s бүртгэл (ажил %s, бүртгэл %s, аудит %s), %d бүс' %
                                        (ds['users'], num(ds['totalRecords']), num(ds['tasks']), num(ds['workLogs']),
                                         num(ds['auditRuns']), ds['zones']), {})],
      [('Арга: ', {'bold': True}), ('20 халаах + 200 дараалсан хүсэлт, HTTP 127.0.0.1, keep-alive', {})],
      [('Машин: ', {'bold': True}), ('%d цөм, %d GB RAM, Node %s, PostgreSQL нэг машинд' %
                                      (mc['cores'], mc['memoryGb'], mc['node'].lstrip('v')), {})],
      [('Хэмжсэн: ', {'bold': True}), (bench['measuredAt'][:10].replace('-', '.') + ' · `npm run bench`', {})],
      [('Үр дүн: ', {'bold': True, 'color': GREEN}),
       ('%d / %d endpoint NFR-06-ийг хангасан' % (sum(r['p95'] < bench['nfr06ThresholdMs'] for r in bench['endpoints']),
                                                 len(bench['endpoints'])), {'bold': True, 'color': GREEN})]],
     size=12, after=9)
box = rect(s, M, Cm(14.3), CW, Cm(3.2), NAVY, radius=Cm(0.25))
shape_text(box, [[('ДҮГНЭЛТ   ', {'color': YELLOW, 'size': 12, 'bold': True}),
                  ('Хамгийн удаан p95 = %.0f мс — босгоос 10 дахин бага. Хязгаарлалт: клиент, сервер нэг машинд; '
                   'бодит сүлжээ, зэрэг олон хэрэглэгчийн ачааллыг III үзлэгт хэмжинэ.' % SLOWEST, {})]],
           size=14, color=WHITE, align=PP_ALIGN.LEFT)

# --------------------------------------------------------------------------- 14. Шинжилгээ: гацаа
s = slide('Шинжилгээ: хэмжилтээр олдсон гацаа ба засвар', 4,
          'Эхний хэмжилтээр сарын тайлан p95 1.75 секунд, хамгийн удаан нь 2.3 секунд байсан нь NFR-06-ийг зөрчих '
          'шахсан. Алгоритмыг тусад нь хэмжихэд K1, K3-ын тооцоо 10 000 бүртгэлд 1.28 секунд зарцуулж байв. Шалтгаан: '
          'огноог цагийн бүсээр хөрвүүлэх dayIn() функц дуудагдах бүртээ шинэ Intl.DateTimeFormat үүсгэдэг байсан. '
          'Formatter-ийг цагийн бүс бүрт нэг удаа үүсгэж кэшлэхэд ижил өгөгдөл дээр тайлан 9 дахин, тооцоо 69 дахин '
          'хурдассан. Энэ бол O(n) алгоритмын тогтмол коэффициентийг багасгасан жишээ.')
picture(s, 'bench_before_after.png', M, Cm(3.55), Cm(19.6), Cm(7.6), valign='top')
rect(s, M, Cm(11.6), Cm(19.6), Cm(5.9), CARD, radius=Cm(0.25))
label(s, M + Cm(0.6), Cm(12.1), Cm(18.4), 'Шалтгаан → засвар → үр дүн')
before_ms, after_ms = p95(bench_before, MONTHLY), p95(bench, MONTHLY)
algo_before, algo_after = p95(bench_before, KPI_ALGO), p95(bench, KPI_ALGO)
text(s, M + Cm(0.6), Cm(12.8), Cm(18.4), Cm(4.6),
     [[('1. ', {'bold': True, 'color': NAVY}), ('dayIn() дуудлага бүрт new Intl.DateTimeFormat(): 10 000 бүртгэлд ≈ 1 с', {})],
      [('2. ', {'bold': True, 'color': NAVY}), ('Formatter-ийг цагийн бүсээр Map-д кэшлэв; алгоритм, үр дүн хэвээр', {})],
      [('3. ', {'bold': True, 'color': NAVY}),
       ('Сарын тайлан %s → %.0f мс (×%.0f); K1 + K3 %s → %.0f мс (×%.0f)' %
        (num(round(before_ms)), after_ms, before_ms / after_ms, num(round(algo_before)), algo_after,
         algo_before / algo_after), {'bold': True})],
      [('Сургамж: ', {'bold': True, 'color': NAVY}),
       ('O(n) алгоритм ч нэг алхмын өртөг өндөр бол удаан; хэмжиж байж л олдсон', {})]], size=12.5, after=8)
x = M + Cm(20.2)
w = W - M - x
label(s, x, Cm(3.65), w, 'Засвар')
path(s, x, Cm(4.25), w, 'backend/src/operations/task-completion.ts')
code(s, x, Cm(4.85), w, Cm(6.3), '''
const dayFormatters =
  new Map<string, Intl.DateTimeFormat>();

export const dayIn = (timeZone, moment) => {
  let formatter = dayFormatters.get(timeZone);
  if (!formatter) {     // цагийн бүсэд нэг удаа
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone, year: 'numeric',
      month: '2-digit', day: '2-digit' });
    dayFormatters.set(timeZone, formatter);
  }
  return formatter.format(moment);
};
''', size=9.5)
tiles(s, Cm(11.6), Cm(2.8), [('×%.0f' % (before_ms / after_ms), 'сарын тайлан, p95'),
                             ('×%.0f' % (algo_before / algo_after), 'K1 + K3 тооцоо, p95', True)], x=x, w=w,
      value_size=22)
text(s, x, Cm(14.8), w, Cm(2.7), 'Хоёр хэмжилтийн JSON (өмнө ба дараа) docs/-д хадгалагдсан тул үр дүнг дахин '
     'шалгаж болно.', size=11, color=MUTED)

# --------------------------------------------------------------------------- 15. ISO/IEC 25010
s = slide('Чанарын үнэлгээ: ISO/IEC 25010', 4,
          'ISO/IEC 25010-ын долоон шинж чанараар юу хэмжсэн, юу хэмжээгүйг ялгаж харууллаа. Үйл ажиллагааны тохирох '
          'байдал, гүйцэтгэл, аюулгүй байдал, засвар үйлчилгээ автомат тестээр хэмжигдсэн. Ашиглахад хялбар байдлыг '
          'SUS асуулгаар, бодит хэрэглэгчидтэй хэмжих ёстой тул III үзлэгийн туршилтын ажиллагаанд хийнэ. Бодит '
          'сүлжээний тасалдал, бусад хөтөч ч мөн хэмжигдээгүй.')
iso = [['Шинж чанар', 'Юугаар шалгасан', 'Үр дүн', 'Төлөв'],
       ['Үйл ажиллагааны тохирох байдал', '22 UC-ийн хүлээн авах тест; K1–K6-ийн unit тест',
        '%d / %d UC' % (results['uc_passed'], results['uc_total']), 'y'],
       ['Гүйцэтгэлийн үр ашиг', '6 endpoint-ийн p50/p95; 10 000 бүртгэл дээрх алгоритм',
        'хамгийн удаан p95 %.0f мс < 2 000' % SLOWEST, 'y'],
       ['Аюулгүй байдал', 'эрхийн матриц; нууц үг сэргээлтийн халдлага', '15 / 15 · 13 / 13', 'y'],
       ['Засвар үйлчилгээ', 'тестийн тоо, lint', '%s тест · lint цэвэр' % num(TOTAL), 'y'],
       ['Найдвартай байдал', 'outbox, дахин илгээлт, Idempotency-Key', '11 / 11 · бодит сүлжээ хэмжээгүй', 'p'],
       ['Нийцтэй байдал', 'Chromium e2e, Android, нэг API', '%d / %d e2e · бусад хөтөч үгүй' %
        (suites['e2e']['passed'], suites['e2e']['passed'] + suites['e2e']['failed']), 'p'],
       ['Ашиглахад хялбар байдал', 'SUS асуулга; axe, Flutter хүртээмжийн автомат шалгалт',
        'SUS хэмжээгүй — III үзлэгт', 'p']]
table(s, M, Cm(3.7), [Cm(7.4), Cm(11.0), Cm(9.4), CW - Cm(27.8)], iso, size=12.5,
      heights=[Cm(0.9)] + [Cm(1.35)] * 7, bold_cols=(0,), align={3: PP_ALIGN.CENTER})
text(s, M, Cm(14.7), CW, Cm(0.6), [[('✓', {'font': SYMBOL, 'color': GREEN, 'bold': True}), (' хэмжсэн     ', {}),
                                    ('∼', {'font': SYMBOL, 'color': AMBER, 'bold': True}),
                                    (' хэсэгчлэн хэмжсэн, үлдсэнийг III үзлэгт', {})]], size=11, color=MUTED)
box = rect(s, M, Cm(15.5), CW, Cm(2.0), CARD, radius=Cm(0.2))
shape_text(box, [[('Эх сурвалж: ', {'bold': True}), ('docs/RESULTS.md, 4-р хэсэг — бодит тестийн гаралтаас '
                                                    'автоматаар үүсгэсэн; ISO/IEC 25010:2011 [21]', {})]],
           size=12, color=INK, align=PP_ALIGN.LEFT)

# --------------------------------------------------------------------------- 16. Мөрдөх матриц
s = slide('Шаардлагын мөрдөх матриц (шинэчилсэн)', 4,
          'I үзлэгт 22 шаардлагын 20 нь кодонд бүрэн байсан. Одоо 22 бүгд бүрэн: KPI самбар (FR-22) хэрэгжиж, '
          'use-case-ийн хүлээн авах тестээр шалгагдсан; сүлжээгүй горим (FR-18) бичихээс гадна сүүлд уншсан '
          'мэдээллийг харуулдаг болсон, зөвхөн зураг хавсаргахад сүлжээ хэрэгтэй. AI тоймыг хиймэл хариугаар л тестэлсэн. Шаардлага бүр аль use-case-ээр хэрэгжсэнийг '
          'гуравдугаар баганад заав; дугаар нь дипломын 2-р бүлэг ба хүлээн авах тестийнхтэй ижил. Туршилтын баганыг '
          'III үзлэгийн туршилтын ажиллагаагаар бөглөнө.')
# Дипломын 2-р бүлгийн мөрдөх матрицтай (table:trace) ижил.
trace = [('FR-01', 'Нэвтрэх, эрхийн хүрээ', 'UC-07', 'y', 'y'), ('FR-02', 'Урилга, эрх олгох', 'UC-17', 'y', 'y'),
         ('FR-03', 'Ажил үүсгэх, оноох', 'UC-09, 10', 'y', 'y'), ('FR-04', 'Ач холбогдлоор харах', 'UC-01', 'y', 'y'),
         ('FR-05', 'Оноолт, өглөөний мэдэгдэл', 'UC-09, 22', 'y', 'y'),
         ('FR-06', 'Талбай, бүс, стандарт', 'UC-19, 22', 'y', 'y'), ('FR-07', 'QR-ээр аудит', 'UC-08, 20', 'y', 'y'),
         ('FR-08', 'Аудитаас засах ажил', 'UC-08, 14', 'y', 'y'), ('FR-09', 'Улаан шошго, зураг', 'UC-05', 'y', 'y'),
         ('FR-10', 'Өдрийн бүртгэл', 'UC-02', 'y', 'y'), ('FR-11', 'Долоо хоногийн тайлан', 'UC-03', 'y', 'y'),
         ('FR-12', 'Сарын тайлан, хаалт', 'UC-04, 16, 22', 'y', 'y'),
         ('FR-13', 'Хагас жил, жилийн тайлан', 'UC-15', 'y', 'y'),
         ('FR-14', 'AI тойм бичвэр', 'UC-16', 'y', 'p'), ('FR-15', 'Өглөөний хурлын самбар', 'UC-11', 'y', 'y'),
         ('FR-16', 'Gemba явалт', 'UC-12', 'y', 'y'), ('FR-17', 'Сайжруулалтын санаа', 'UC-06, 13', 'y', 'y'),
         ('FR-18', 'Сүлжээгүй горим', 'UC-02, 08', 'y', 'y'), ('FR-19', 'Монгол, англи хэл', 'бүгд', 'y', 'y'),
         ('FR-20', 'Үйл ажиллагааны түүх', 'UC-21', 'y', 'y'), ('FR-21', 'Бүртгэл устгах хүсэлт', 'UC-07', 'y', 'y'),
         ('FR-22', 'KPI самбар (K1–K6)', 'UC-04, 14', 'y', 'y')]
cols = [Cm(1.7), Cm(5.6), Cm(3.05), Cm(1.5), Cm(1.5)]
cols.append(int(half_w) - sum(cols))
for k in range(2):
    rows = [['FR', 'Шаардлага', 'Use-case', 'Код', 'Тест', 'Турш.']]
    rows += [[a, b, c, d, e, 'n'] for a, b, c, d, e in trace[k * 11:(k + 1) * 11]]
    table(s, M + int(k * (half_w + Cm(0.6))), Cm(3.6), cols, rows, size=11.5, row_h=Cm(0.94), bold_cols=(0,),
          align={2: PP_ALIGN.CENTER, 3: PP_ALIGN.CENTER, 4: PP_ALIGN.CENTER, 5: PP_ALIGN.CENTER})
stats = [('Кодонд хэрэгжсэн', '22 бүрэн', 'FR-18: зураг хавсаргахад л сүлжээ хэрэгтэй'),
         ('Тестээр шалгасан', '21 бүрэн · 1 хэсэгчлэн', 'FR-14: AI-ийг хиймэл хариугаар'),
         ('Туршилтаар хэмжсэн', 'III үзлэгт', 'Пилот: 2 + 4 долоо хоног, K1–K7')]
stat_w = (CW - Cm(1.0)) / 3
for i, (head, value, note) in enumerate(stats):
    x = M + int(i * (stat_w + Cm(0.5)))
    rect(s, x, Cm(15.3), int(stat_w), Cm(2.2), CARD, radius=Cm(0.2))
    label(s, x + Cm(0.5), Cm(15.5), int(stat_w) - Cm(1.0), head, size=9.5)
    text(s, x + Cm(0.5), Cm(16.0), int(stat_w) - Cm(1.0), Cm(0.7), value, size=14, bold=True, color=NAVY)
    text(s, x + Cm(0.5), Cm(16.72), int(stat_w) - Cm(1.0), Cm(0.7), note, size=10.5, color=MUTED)

# --------------------------------------------------------------------------- 17. Үр дүн системд
s = slide('Үр дүн системд: K1–K6 ба засварын баталгаажуулалт', 4,
          'Алгоритмуудын үр дүн системд ингэж харагдана. Зүүн талд сарын тайлангийн K1–K6: утга бүр тоологч, '
          'хуваарь, тооцоонд ороогүй бүртгэлийн тоотой, K2, K4, K6-д тоологдсон ажлыг дэлгэж харж болно. Баруун талд '
          'засах ажлын баталгаажуулалт: засвар бүрийн өмнөх ба дараагийн аудитын оноо, дүгнэлт, үндсэн шалтгаан, '
          'менежерийн баталгаажуулалт. Зургийг демо өгөгдөл дээр авсан тул тоо нь бодит байгууллагынх биш.')
for k, (name, caption) in enumerate([('ui_kpi.png', 'Сарын тайлан: K1–K6, тоологч ба хуваарьтай'),
                                     ('ui_fixes.png', 'Аудитын үр дүн: засвар дараагийн аудитаар шалгагдана')]):
    x = M + int(k * (half_w + Cm(0.6)))
    rect(s, x, Cm(3.6), int(half_w), Cm(10.3), WHITE, radius=Cm(0.25), line=LINE)
    picture(s, name, x + Cm(0.3), Cm(3.9), int(half_w) - Cm(0.6), Cm(9.7))
    text(s, x, Cm(14.15), int(half_w), Cm(0.7), caption, size=11.5, color=MUTED, italic=True, align=PP_ALIGN.CENTER)
box = rect(s, M, Cm(15.2), CW, Cm(2.3), NAVY, radius=Cm(0.25))
shape_text(box, [[('ДЕМО ӨГӨГДӨЛ   ', {'color': YELLOW, 'size': 12, 'bold': True}),
                  ('Бодит байгууллагын тоог III үзлэгийн пилотоор (2 + 4 долоо хоног) хэмжинэ; одоо систем тооцох, '
                   'харуулах чадвараа харуулж байна.', {})]], size=14, color=WHITE, align=PP_ALIGN.LEFT)

# --------------------------------------------------------------------------- 18. Демо
s = slide('Демо: ажиллаж буй систем', 4,
          'Одоо системийг амьдаар үзүүлье. Дөрвөн алхамтай: менежер ажил оноож, ажилтан утаснаасаа дуусгана. Ажилтан '
          'QR уншуулж 5S аудит хийнэ, оноо 85-аас доош тул засах ажил автоматаар үүснэ. Засвар хийж шалтгааныг бичээд '
          'менежер баталгаажуулж, дахин аудитаар verified болно. Эцэст нь сарын тайлангийн K1–K6-г үзүүлж, хаасан '
          'сарыг шалтгаантай дахин нээнэ. Сүлжээ тасарвал урьдчилан бичсэн бичлэгээр үзүүлнэ.')
steps = [('1', 'Ажил оноох → утаснаас дуусгах', 'Менежер вэбээс ажил оноож, ажилтан утсандаа мэдэгдэл авч дуусгана',
          'UC-09 · UC-01'),
         ('2', 'QR-ээр 5S аудит, сүлжээгүй үед', 'Оноо < 85 → бүсийн хариуцагчид засах ажил; офлайн бол outbox-д',
          'UC-08 · UC-02'),
         ('3', 'Засвар → шалтгаан → баталгаажуулалт', 'Дахин аудитаар засвар verified болно (5S → Үр дүн)',
          'UC-14'),
         ('4', 'Сарын тайлан K1–K6, хаах, дахин нээх', 'Нотлох бичлэг, CSV; дахин нээхэд шалтгаан, түүх хадгалагдана',
          'UC-16')]
for i, (n, head, body, ucs) in enumerate(steps):
    y = Cm(3.75 + i * 3.45)
    badge = rect(s, M, y, Cm(1.5), Cm(1.5), YELLOW if i == 0 else NAVY)
    shape_text(badge, n, size=18, bold=True, color=NAVY if i == 0 else WHITE)
    text(s, M + Cm(2.1), y + Cm(0.0), Cm(12.6), Cm(0.8), head, size=16, bold=True, color=INK)
    text(s, M + Cm(2.1), y + Cm(0.85), Cm(12.6), Cm(1.6), body, size=12, color=MUTED, line=1.0)
    chip = rect(s, M + Cm(14.9), y + Cm(0.15), Cm(3.3), Cm(0.8), WHITE, radius=Cm(0.4), line=LINE)
    shape_text(chip, ucs, size=10.5, bold=True, color=NAVY)
x = Cm(20.6)
w1 = phone(s, 'mob_audit.png', x, Cm(3.65), Cm(11.2))
phone(s, 'mob_today.png', x + w1 + Cm(0.45), Cm(3.65), Cm(11.2))
text(s, x, Cm(15.1), W - M - x, Cm(2.4),
     [[('Нөөц: ', {'bold': True}), ('урьдчилан бичсэн дэлгэцийн бичлэг, демо өгөгдөл (start-dev.ps1 -Setup)', {})]],
     size=11, color=MUTED)

# --------------------------------------------------------------------------- 19. Төлөв, төлөвлөгөө
s = slide('Одоогийн төлөв ба III үзлэгийн төлөвлөгөө', 4,
          'Гол урсгалууд кодонд хэрэгжиж, автомат тестээр баталгаажсан. Туршилтын багана хоосон байгаа нь бодит '
          'байгууллагад хэмжээгүйг илтгэнэ. III үзлэг хүртэл хэрэглэгчийн судалгаа авч, системийг нийтийн серверт '
          'байршуулаад пилот байгууллагад хоёр долоо хоног суурь хэмжилт, дөрвөн долоо хоног туршилт хийж K1–K7, SUS '
          'үнэлгээг авна.')
status = [['Хэсэг', 'Код', 'Тест', 'Туршилт'],
          ['Ажил, төсөл, мэдэгдэл', 'y', 'y', 'n'], ['5S талбай, аудит, засах ажил', 'y', 'y', 'n'],
          ['PDCA шалгалт, баталгаажуулалт', 'y', 'y', 'n'], ['Өдрийн ба долоо хоногийн тайлан', 'y', 'y', 'n'],
          ['Сарын тайлан, K1–K6, хаалт', 'y', 'y', 'n'], ['Gemba, санаа, өглөөний хурал', 'y', 'y', 'n'],
          ['Бүртгэл, нууц үг сэргээх, session', 'y', 'y', 'n'], ['Сүлжээгүй горим', 'y', 'y', 'n'],
          ['Хэрэглэгчийн судалгаа, SUS', 'n', 'n', 'n']]
table(s, M, Cm(3.65), [Cm(9.4), Cm(2.8), Cm(2.8), Cm(2.8)], status, size=12, row_h=Cm(0.9),
      align={1: PP_ALIGN.CENTER, 2: PP_ALIGN.CENTER, 3: PP_ALIGN.CENTER})
tiles(s, Cm(12.95), Cm(2.3), [(num(suites['backend']['passed']), 'backend'), (num(suites['uc']['passed']), 'use-case'),
                              (num(suites['web']['passed']), 'вэб'), (num(suites['mobile']['passed']), 'гар утас'),
                              (num(suites['e2e']['passed']), 'e2e')], x=M, w=Cm(17.8), gap=Cm(0.25), value_size=17)
text(s, M, Cm(15.6), Cm(17.8), Cm(1.8),
     [[('✓', {'font': SYMBOL, 'color': GREEN, 'bold': True}), (' бүрэн   ', {}),
       ('∼', {'font': SYMBOL, 'color': AMBER, 'bold': True}), (' хэсэгчлэн   ', {}),
       ('–', {'color': GREY, 'bold': True}), (' хараахан үгүй.  Бүх тест давсан (%s).' %
                                              results['date'].replace('-', '.'), {})]], size=11, color=MUTED)
x = Cm(20.6)
w = W - M - x
label(s, x, Cm(3.75), w, 'Үзлэгийн хуваарь')
rect(s, x + Cm(0.3), Cm(4.85), Cm(0.08), Cm(10.6), LINE)
milestones = [('I үзлэг · 09.30', 'Онол, шаардлага, use-case, архитектур, алгоритмын зохиомж', GREEN),
              ('II үзлэг · 11.03–05', 'Алгоритмын кодчилол, туршилт, үр дүн — энэ илтгэл', YELLOW),
              ('III үзлэг · 12.02–03', 'Судалгаа; нийтийн серверт байршуулах; пилот 2 + 4 долоо хоног; K1–K7, SUS; '
                                       'дүгнэлт', WHITE),
              ('Урьдчилсан хамгаалалт · 12.28', 'Илтгэл, хэвлэмэл диплом, туршилтын программ', WHITE)]
for i, (head, body, colour) in enumerate(milestones):
    y = Cm(4.5 + i * 3.35)
    rect(s, x + Cm(0.04), y + Cm(0.05), Cm(0.6), Cm(0.6), colour, line=NAVY if colour == WHITE else None,
         line_w=Pt(1.5), shape=MSO_SHAPE.OVAL)
    text(s, x + Cm(1.1), y, w - Cm(1.1), Cm(0.8), head, size=15, bold=True, color=INK)
    text(s, x + Cm(1.1), y + Cm(0.85), w - Cm(1.1), Cm(2.3), body, size=12, color=MUTED)

# --------------------------------------------------------------------------- 20. Баярлалаа
s = dark_slide('Анхаарал хандуулсанд баярлалаа. Асуулт, санал хүлээн авахад бэлэн байна. Нэмэлт слайдад сарын '
               'хэмжүүрийн шийдвэрүүд, эрхийн матриц, технологийн стек бий.')
rect(s, 0, 0, W, Cm(0.35), YELLOW)
label(s, M, Cm(5.2), CW, 'Дипломын ажлын II үзлэг', color=YELLOW, size=12, align=PP_ALIGN.CENTER)
text(s, M, Cm(6.3), CW, Cm(3.6), ['Анхаарал хандуулсанд', 'баярлалаа'], size=44, bold=True, color=WHITE,
     align=PP_ALIGN.CENTER, after=0, line=1.0)
text(s, M, Cm(10.6), CW, Cm(1.0), 'Асуулт, санал?', size=20, color=PALE, align=PP_ALIGN.CENTER)
text(s, M, Cm(15.6), CW, Cm(1.6), [AUTHOR + ' · B190910014', 'Удирдагч: Доктор (Ph.D), дэд профессор Г.Ганчимэг'],
     size=12, color=PALE, align=PP_ALIGN.CENTER, after=3)

# --------------------------------------------------------------------------- Нэмэлт слайдууд
s = slide('Сарын хэмжүүрийн шийдвэрүүд', 0,
          'Дипломд K2, K4, K6-ийн томьёо ерөнхий байсан тул кодлохдоо таван шийдвэр гаргасан. Эдгээрийг удирдагч '
          'багштай баталгаажуулах шаардлагатай.', number='Н1')
decisions = [('K2 — тухайн өдрийн байдал', 'Дууссан сарыг сүүлийн өдрөөр, үргэлжилж буйг өнөөдрөөр тооцно; сар '
                                           'дууссаны дараа тоо өөрчлөгдөхгүй.'),
             ('K2 — өмнөх сарын ажил', '2-р сард хугацаа нь болсон, 3-р сард нээлттэй ажил 3-р сард хоцорсонд '
                                       'тооцогдоно.'),
             ('K4 — яг өнгөрсөн хугацаа', 'createdAt-аас completedAt хүртэл бутархай хоногоор; зөвхөн аудитаас '
                                          'үүссэн ажил, улаан шошго тусдаа.'),
             ('K6 — хүн-долоо хоног', 'Бичсэн (хүн, долоо хоног) хос / хүлээгдэх; долоо хоног Даваа гаригаараа '
                                      'сардаа хамаарна; админыг хүлээхгүй.'),
             ('Хуучин тайлан', 'Энэ өөрчлөлтөөс өмнө хаасан тайланд K2, K6 null («өгөгдөлгүй»); амьд өгөгдлөөс дахин '
                               'тооцохгүй.')]
for i, (head, body) in enumerate(decisions):
    x = M + int((i % 2) * (half_w + Cm(0.6)))
    y = Cm(3.75 + (i // 2) * 4.65)
    rect(s, x, y, int(half_w), Cm(4.25), NAVY if i == 4 else CARD, radius=Cm(0.25))
    text(s, x + Cm(0.6), y + Cm(0.45), int(half_w) - Cm(1.2), Cm(0.8), head, size=16, bold=True,
         color=YELLOW if i == 4 else NAVY)
    text(s, x + Cm(0.6), y + Cm(1.4), int(half_w) - Cm(1.2), Cm(2.7), body, size=13, color=WHITE if i == 4 else INK)
x = M + int(half_w + Cm(0.6))
rect(s, x, Cm(13.05), int(half_w), Cm(4.25), WHITE, radius=Cm(0.25), line=LINE)
text(s, x + Cm(0.6), Cm(13.5), int(half_w) - Cm(1.2), Cm(0.8), 'Баталгаажуулах', size=16, bold=True, color=NAVY)
text(s, x + Cm(0.6), Cm(14.45), int(half_w) - Cm(1.2), Cm(2.7), 'Удирдагч багштай тохирч, дипломын 3-р бүлгийн '
     'K1–K7-ийн тайлбарт тусгана. Эх сурвалж: docs/measurements.md.', size=13, color=INK)

s = slide('Эрхийн матриц: татгалзах ёстой үйлдэл', 0,
          'Use-case-ийн тестийн татгалзсан урсгалуудаас эрхийн матрицыг гаргав. Бүх 15 тохиолдолд сервер хүлээгдсэн '
          'ёсоор татгалзсан.', number='Н2')
refusals = [['UC', 'Хэн', 'Юуг хийж чадахгүй'],
            ['UC-01', 'ажилтан', 'бусдын ажлыг өөрчлөх'], ['UC-03', 'ажилтан', 'багийн долоо хоногийн тайлан унших'],
            ['UC-04', 'ажилтан', 'багийн сарын тойм ноороглох'],
            ['UC-07', 'хэн ч', 'буруу нууц үгээр солих; мартсан хаягийг тандах'],
            ['UC-08', 'хэн ч', 'байхгүй шалгах хуудсаар аудит хийх'], ['UC-09', 'ажилтан', 'төсөл үүсгэх'],
            ['UC-10', 'ажилтан', 'бусдад ажил төлөвлөх'], ['UC-12', 'ажилтан', 'Gemba явалт бүртгэх'],
            ['UC-13', 'ажилтан', 'санаа шийдвэрлэх'], ['UC-16', 'менежер', 'үргэлжилж буй сарыг хаах'],
            ['UC-17', 'ажилтан', 'хүн урих'], ['UC-18', 'ажилтан', 'байгууллагын бүтэц өөрчлөх'],
            ['UC-19', 'ажилтан', '5S төлөвлөгөө үүсгэх'], ['UC-20', 'ажилтан', 'шалгах хуудас үүсгэх'],
            ['UC-21', 'менежер, ажилтан', 'үйл ажиллагааны түүх унших']]
table(s, M, Cm(3.6), [Cm(2.6), Cm(5.4), Cm(14.0)], refusals, size=11.5, row_h=Cm(0.86), bold_cols=(0,))
x = M + Cm(22.6)
w = W - M - x
tile(s, x, Cm(3.6), w, Cm(3.2), '15 / 15', 'татгалзах ёстой үйлдэлд сервер татгалзсан', dark=True)
text(s, x, Cm(7.3), w, Cm(6.0), 'Ажилтанд бусдын ажил «олдсонгүй» (404) гэж харагдана: байгаа эсэхийг нь ч '
     'задруулахгүй. Эрхийг сервер шалгана; вэбийн цэс зөвхөн тохиромжийн төлөө нуудаг.', size=12, color=MUTED)

s = slide('Технологийн стек', 0,
          'Ашигласан технологи, хувилбар, юунд ашигласныг нэгтгэв. Хувилбар нь package-ийн доод хязгаар.',
          number='Н3')
stack = [['Давхарга', 'Технологи', 'Хувилбар', 'Юунд'],
         ['Backend (API)', 'NestJS, TypeScript, Express', 'NestJS 11, TS 5', 'REST API, модуль'],
         ['Өгөгдлийн сан', 'PostgreSQL, TypeORM', 'PostgreSQL 15/16, TypeORM 0.3', '29 хүснэгт, 49 migration'],
         ['Аюулгүй байдал', 'JWT, Passport, bcrypt, Helmet, Throttler', '@nestjs/jwt 11, bcrypt 6', 'нэвтрэх, RBAC, хязгаар'],
         ['Вэб', 'React, Vite, Tailwind, TanStack Query', 'React 18, Vite 8', 'менежер, ажилтны самбар'],
         ['Гар утас', 'Flutter, Provider, go_router, Dio', 'Flutter 3.47, Dio 5', 'Android апп, QR, outbox'],
         ['Хэл', 'i18next, flutter_localizations', 'i18next 26', 'монгол / англи'],
         ['Мэйл, хуваарь', 'Nodemailer, @nestjs/schedule', 'Nodemailer 10', 'урилга, сануулга, сэргээлт'],
         ['AI', 'Claude API (сонголтоор)', '—', 'сарын тоймын ноорог'],
         ['Байршуулалт', 'Docker Compose, nginx, Redis', '—', 'production stack, нөөцлөлт'],
         ['Тест, CI', 'Jest, Vitest, Playwright + axe, flutter_test', 'Jest 30, Vitest 4', 'GitHub Actions']]
table(s, M, Cm(3.6), [Cm(4.6), Cm(10.6), Cm(7.6), CW - Cm(22.8)], stack, size=12, row_h=Cm(1.24), bold_cols=(0,))

os.makedirs(OUTPUT, exist_ok=True)
out = os.path.join(OUTPUT, 'Uzleg2_iltgel.pptx')
prs.save(out)
print(out, len(prs.slides._sldIdLst), 'slides')
