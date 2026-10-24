"""Дипломын бичвэрийн диаграмууд. python make_figures.py -> latex/Figures/*.png"""
import os

import matplotlib

matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Ellipse, FancyBboxPatch, Rectangle

plt.rcParams['font.family'] = 'Arial'
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'latex', 'Figures')
os.makedirs(OUT, exist_ok=True)
INK = '#1f2937'
BLUE = '#dbeafe'
BLUE_E = '#1d4ed8'
GREY = '#f3f4f6'
AMBER = '#fef3c7'
GREEN = '#dcfce7'


def box(ax, x, y, w, h, text, fc=GREY, ec=INK, size=10, bold=False):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0,rounding_size=0.08', fc=fc, ec=ec, lw=1.2))
    ax.text(x + w / 2, y + h / 2, text, ha='center', va='center', fontsize=size, color=INK,
            fontweight='bold' if bold else 'normal')


def arrow(ax, x1, y1, x2, y2, text='', both=False):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1), arrowprops=dict(arrowstyle='-|>', color=INK, lw=1.1))
    if both:
        ax.annotate('', xy=(x1, y1), xytext=(x2, y2), arrowprops=dict(arrowstyle='-|>', color=INK, lw=1.1))
    if text:
        ax.text((x1 + x2) / 2, (y1 + y2) / 2 + 0.05, text, fontsize=8, ha='center', va='bottom', color='#374151',
                bbox=dict(fc='white', ec='none', pad=1))


def canvas(w, h):
    fig, ax = plt.subplots(figsize=(w, h))
    ax.set_xlim(0, w)
    ax.set_ylim(0, h)
    ax.axis('off')
    return fig, ax


def save(fig, name):
    fig.savefig(os.path.join(OUT, name), dpi=200, bbox_inches='tight', facecolor='white')
    plt.close(fig)


def actor(ax, x, y, name):
    ax.add_patch(plt.Circle((x, y + 0.55), 0.14, fc='white', ec=INK, lw=1.2))
    ax.plot([x, x], [y + 0.41, y + 0.05], color=INK, lw=1.2)
    ax.plot([x - 0.22, x + 0.22], [y + 0.3, y + 0.3], color=INK, lw=1.2)
    ax.plot([x, x - 0.18], [y + 0.05, y - 0.22], color=INK, lw=1.2)
    ax.plot([x, x + 0.18], [y + 0.05, y - 0.22], color=INK, lw=1.2)
    ax.text(x, y - 0.42, name, ha='center', va='top', fontsize=9.5, fontweight='bold')


def usecase(ax, x, y, text, w=2.7, h=0.52):
    ax.add_patch(Ellipse((x, y), w, h, fc=BLUE, ec=BLUE_E, lw=1.1))
    ax.text(x, y, text, ha='center', va='center', fontsize=8.4)


# 1. Use-case диаграм: 22 use-case, дугаар нь хүлээн авах тесттэй ижил (backend/test/use-cases)
EMPLOYEE_CASES = [('UC-01', 'Оноосон ажлаа гүйцэтгэх'), ('UC-02', 'Өдрийн ажлын бүртгэл хөтлөх'),
                  ('UC-03', 'Долоо хоногийн тайлан бичих'), ('UC-04', 'Сарын тайлангаа өөрийн\nбүртгэлээс бэлтгэх'),
                  ('UC-05', 'Улаан шошгоор дутагдал бүртгэх'), ('UC-06', 'Сайжруулалтын санаа гаргах'),
                  ('UC-07', 'Хувийн бүртгэлээ удирдах'), ('UC-08', '5S аудит хийх')]
MANAGER_CASES = [('UC-09', 'Төсөл үүсгэж, ажил оноож хянах'), ('UC-10', 'Сарын төлөвлөгөө гаргах'),
                 ('UC-11', 'Өглөөний хурал хөтлөх'), ('UC-12', 'Gemba явалт хийх'),
                 ('UC-13', 'Санааг хянаж шийдвэрлэх'), ('UC-14', 'Багийн бүтээмжийг дүгнэх'),
                 ('UC-15', 'Хагас жил, жилийн тайлан гаргах'), ('UC-16', 'Сарын тайланг хааж батлах')]
ADMIN_CASES = [('UC-17', 'Хэрэглэгч урьж, эрх олгох'), ('UC-18', 'Хэлтэс, байгууллагын\nтохиргоо хийх'),
               ('UC-19', '5S талбай, стандарт тохируулах'), ('UC-20', 'Аудитын шалгах хуудас\nболовсруулах'),
               ('UC-21', 'Үйл ажиллагааны түүх шалгах')]


def usecase_diagram():
    fig, ax = canvas(14.2, 17.2)
    ax.add_patch(Rectangle((1.9, 0.5), 10.4, 16.3, fc='white', ec=INK, lw=1.4))
    ax.text(7.1, 16.45, 'Бүтээмжийн платформ', ha='center', fontsize=12, fontweight='bold')
    w, h = 3.5, 1.0
    pos = {}

    def case(uc, name, x, y):
        pos[uc] = (x, y)
        two_lines = '\n' in name
        ax.add_patch(Ellipse((x, y), w, h, fc=BLUE, ec=BLUE_E, lw=1.1))
        ax.text(x, y + (0.28 if two_lines else 0.2), uc, ha='center', va='center', fontsize=8, fontweight='bold',
                color=BLUE_E)
        ax.text(x, y - (0.13 if two_lines else 0.12), name, ha='center', va='center', fontsize=8.2, linespacing=1.05)

    rows = [15.6 - i * 1.15 for i in range(8)]
    for (uc, name), y in zip(EMPLOYEE_CASES, rows):
        case(uc, name, 3.9, y)
    for (uc, name), y in zip(MANAGER_CASES, rows):
        case(uc, name, 10.25, y)
    for i, (uc, name) in enumerate(ADMIN_CASES):
        case(uc, name, 10.25, 5.95 - i * 1.15)
    case('UC-22', 'Сануулга илгээх, аудит товлох', 3.9, 4.2)

    # «include» ба «extend»: 22-т тоологдохгүй, бусад use-case-ийн хэсэг
    for key, name, x, y in (('notify', 'Ажил үүсгэж мэдэгдэх', 7.07, 10.4), ('ai', 'AI-аар тойм ноороглох', 7.07, 6.6)):
        pos[key] = (x, y)
        ax.add_patch(Ellipse((x, y), 2.35, 0.7, fc='white', ec=BLUE_E, lw=1.0, ls='--'))
        ax.text(x, y, name, ha='center', va='center', fontsize=7.8)
    dashed = dict(arrowstyle='-|>', color=INK, lw=0.9, ls='--')
    for uc in ('UC-08', 'UC-09', 'UC-12', 'UC-13'):
        x, y = pos[uc]
        side = 1 if x < 7 else -1
        ax.annotate('', xy=(7.07 - side * 1.17, 10.4), xytext=(x + side * w / 2, y), arrowprops=dashed)
    ax.text(7.07, 10.95, '«include»', ha='center', fontsize=7.6, color='#374151')
    x, y = pos['UC-16']
    ax.annotate('', xy=(x - w / 2, y), xytext=(7.07 + 1.17, 6.6), arrowprops=dashed)
    ax.text(7.07, 7.1, '«extend»', ha='center', fontsize=7.6, color='#374151')

    actor(ax, 0.8, 11.3, 'Ажилтан')
    actor(ax, 13.4, 11.3, 'Менежер')
    actor(ax, 13.4, 3.6, 'Админ')
    actor(ax, 0.8, 3.0, 'Цагийн\nхуваарь')
    line = dict(color='#6b7280', lw=0.8)

    def link(fx, fy, keys, side):
        for key in keys:
            x, y = pos[key]
            ax.plot([fx, x + side * w / 2], [fy, y], **line)

    link(1.05, 11.45, [uc for uc, _ in EMPLOYEE_CASES], -1)
    link(13.15, 11.45, [uc for uc, _ in MANAGER_CASES], 1)
    link(13.15, 3.75, [uc for uc, _ in ADMIN_CASES], 1)
    link(1.05, 3.15, ['UC-22'], -1)
    # Эрхийн удамшил: админ менежерийн, менежер ажилтны бүх use-case-ийг өвлөнө
    ax.annotate('', xy=(13.4, 10.4), xytext=(13.4, 4.45), arrowprops=dict(arrowstyle='-|>', color=INK, lw=1, ls='--'))
    ax.text(13.62, 7.4, 'өвлөнө', fontsize=8, rotation=90, va='center')
    save(fig, 'usecase.png')


# 1б. Илтгэлийн use-case диаграм: хэвтээ, том үсэгтэй; тодорхойлсон use-case-ууд UC дугаартай
def usecase_slide():
    fig, ax = canvas(14, 7.1)
    ax.add_patch(Rectangle((2.2, 0.3), 9.6, 6.7, fc='white', ec=INK, lw=1.4))
    ax.text(7.0, 6.72, 'Бүтээмжийн платформ', ha='center', va='center', fontsize=14, fontweight='bold')
    # (түлхүүр, нэр, тодорхойлсон бол UC дугаар); баганын дарааллаар дээрээс доош
    left = [('login', 'Нэвтрэх', 'UC-01'), ('tasks', 'Өөрийн ажлыг харах, дуусгах', ''),
            ('worklog', 'Өдрийн бүртгэл хөтлөх', ''), ('checkin', 'Долоо хоногийн тайлан бичих', 'UC-07'),
            ('audit', '5S аудит хийх (QR)', 'UC-02'), ('redtag', 'Улаан шошго бүртгэх', ''),
            ('idea', 'Сайжруулалтын санаа илгээх', 'UC-06'), ('inbox', 'Мэдэгдэл унших', ''),
            ('archive', 'Тайлан, архив үзэх', '')]
    right = [('assign', 'Ажил оноох, хянах', 'UC-03'), ('huddle', 'Өглөөний хурал хөтлөх', 'UC-08'),
             ('gemba', 'Gemba явалт бүртгэх', 'UC-05'), ('review', 'Санаа хянах', ''),
             ('report', 'Сарын тайлан хаах, батлах', 'UC-04'), ('layout', '5S талбай, стандарт тохируулах', 'UC-09'),
             ('users', 'Хэрэглэгч урих, эрх олгох', ''), ('org', 'Байгууллагын тохиргоо', ''),
             ('remind', 'Сануулга, аудит төлөвлөх', '')]
    w, h = 4.2, 0.6
    rows = [6.2 - i * 0.66 for i in range(9)]
    pos = {}
    for column, x in ((left, 4.7), (right, 9.3)):
        for (key, name, uc), y in zip(column, rows):
            pos[key] = (x, y)
            ax.add_patch(Ellipse((x, y), w, h, fc='#bfdbfe' if uc else BLUE, ec=BLUE_E, lw=1.8 if uc else 1.0))
            if uc:
                ax.text(x, y + 0.14, uc, ha='center', va='center', fontsize=9.5, fontweight='bold', color=BLUE_E)
                ax.text(x, y - 0.1, name, ha='center', va='center', fontsize=11.5, color=INK)
            else:
                ax.text(x, y, name, ha='center', va='center', fontsize=12, color=INK)

    def figure(x, y, name):
        ax.add_patch(plt.Circle((x, y + 0.62), 0.16, fc='white', ec=INK, lw=1.4))
        ax.plot([x, x], [y + 0.46, y + 0.06], color=INK, lw=1.4)
        ax.plot([x - 0.25, x + 0.25], [y + 0.33, y + 0.33], color=INK, lw=1.4)
        ax.plot([x, x - 0.2], [y + 0.06, y - 0.25], color=INK, lw=1.4)
        ax.plot([x, x + 0.2], [y + 0.06, y - 0.25], color=INK, lw=1.4)
        ax.text(x, y - 0.35, name, ha='center', va='top', fontsize=12.5, fontweight='bold')

    figure(1.0, 4.1, 'Ажилтан')
    figure(1.0, 1.1, 'Ажиглагч')
    figure(13.0, 4.5, 'Менежер')
    figure(13.0, 2.1, 'Админ')
    figure(13.0, 0.3, 'Цагийн хуваарь')
    line = dict(color='#6b7280', lw=0.9)

    def link(fx, fy, keys, side):
        for key in keys:
            x, y = pos[key]
            ax.plot([fx, x + side * w / 2], [fy, y], **line)

    link(1.3, 4.35, ['login', 'tasks', 'worklog', 'checkin', 'audit', 'redtag', 'idea', 'inbox'], -1)
    link(1.3, 1.35, ['inbox', 'archive'], -1)
    link(12.7, 4.75, ['assign', 'huddle', 'gemba', 'review', 'report', 'layout'], 1)
    link(12.7, 2.35, ['users', 'org'], 1)
    link(12.7, 0.55, ['remind'], 1)
    # Эрхийн удамшил: ажилтан ажиглагчийн, админ менежерийн бүх use-case-ийг өвлөнө
    dashed = dict(arrowstyle='-|>', color=INK, lw=1.1, ls='--')
    ax.annotate('', xy=(1.0, 2.0), xytext=(1.0, 3.45), arrowprops=dashed)
    ax.text(0.65, 2.72, 'өвлөнө', fontsize=10, rotation=90, va='center')
    ax.annotate('', xy=(13.0, 3.85), xytext=(13.0, 2.95), arrowprops=dashed)
    ax.text(13.35, 3.4, 'өвлөнө', fontsize=10, rotation=90, va='center')
    save(fig, 'usecase_slide.png')


# 2. Архитектур
def architecture():
    fig, ax = canvas(11, 6.6)
    box(ax, 0.3, 4.6, 3.0, 1.6, 'Вэб апп\nReact 18 · Vite · Tailwind\ni18next (mn/en)', BLUE, BLUE_E, 9.5)
    box(ax, 0.3, 2.4, 3.0, 1.6, 'Гар утасны апп\nFlutter · Provider · Dio\nOffline outbox', BLUE, BLUE_E, 9.5)
    box(ax, 4.1, 1.1, 3.6, 5.3, '', 'white', INK)
    ax.text(5.9, 6.1, 'Backend API (NestJS 11)', ha='center', fontsize=10, fontweight='bold')
    layers = [
        ('JWT нэвтрэлт · PermissionsGuard\n(эрхийн хүснэгт)', 5.05),
        ('Controller-ууд (REST, /api)', 4.15),
        ('Service-үүд: ажил, 5S, аудит,\nтайлан, Gemba, санаа, мэдэгдэл', 3.2),
        ('TypeORM repository · migration', 2.25),
        ('Cron: сануулга, аудит, сар хаах', 1.3),
    ]
    for text, y in layers:
        box(ax, 4.35, y, 3.1, 0.72, text, GREY, '#9ca3af', 8.5)
    box(ax, 8.6, 3.5, 2.2, 1.4, 'PostgreSQL\n25 хүснэгт\n38 migration', AMBER, '#b45309', 9.5)
    box(ax, 8.6, 1.6, 2.2, 1.2, 'Файл хадгалалт\n(зураг, хавсралт)', AMBER, '#b45309', 9)
    box(ax, 8.6, 5.3, 2.2, 1.0, 'Anthropic API\n(сарын тойм, сонголтоор)', GREEN, '#15803d', 8.5)
    arrow(ax, 3.3, 5.4, 4.1, 5.4, 'HTTPS/JSON', both=True)
    arrow(ax, 3.3, 3.2, 4.1, 3.2, 'HTTPS/JSON', both=True)
    arrow(ax, 7.7, 4.2, 8.6, 4.2, 'SQL', both=True)
    arrow(ax, 7.7, 2.2, 8.6, 2.2, '', both=True)
    arrow(ax, 7.7, 5.8, 8.6, 5.8, 'нэргүй тоо')
    ax.text(5.5, 0.5, 'Docker Compose: nginx (вэб) + api + postgres', ha='center', fontsize=9, style='italic')
    save(fig, 'architecture.png')


# 3. Өгөгдлийн загвар (хураангуй)
def er_diagram():
    fig, ax = canvas(11, 7.6)
    ents = {
        'org': (4.4, 6.2, 'organizations', 'id, name, code\nsettings (jsonb)'),
        'dept': (0.3, 6.2, 'departments', 'id, name\norganizationId'),
        'proj': (8.4, 6.2, 'projects', 'id, name, status\nprogress, dueDate'),
        'user': (0.3, 4.2, 'users', 'id, email, role\norganizationId\ndepartmentId'),
        'task': (4.4, 4.2, 'tasks', 'id, title, status\nassigneeId, dueDate\nsourceType, sourceId'),
        'layout': (8.4, 4.2, 'five_s_layouts', 'id, zones (jsonb)\nownerId, version'),
        'worklog': (0.3, 2.2, 'work_logs', 'id, userId, day\ndone, next'),
        'run': (4.4, 2.2, 'audit_runs', 'id, zoneId, score\nanswers, status'),
        'tmpl': (8.4, 2.2, 'audit_templates', 'id, questions\n(jsonb), tier'),
        'checkin': (0.3, 0.2, 'weekly_checkins', 'id, userId, week\nplans, problems'),
        'idea': (4.4, 0.2, 'ideas', 'id, authorId\nstatus, reply'),
        'gemba': (8.4, 0.2, 'gemba_walks', 'id, walkerId, area\nobservations\nfollowUps → tasks'),
    }
    for x, y, name, fields in ents.values():
        ax.add_patch(Rectangle((x, y), 2.3, 1.2, fc='white', ec=INK, lw=1.1, zorder=2))
        ax.add_patch(Rectangle((x, y + 0.85), 2.3, 0.35, fc=BLUE, ec=INK, lw=1.1, zorder=2))
        ax.text(x + 1.15, y + 1.025, name, ha='center', va='center', fontsize=9, fontweight='bold', zorder=3)
        ax.text(x + 0.1, y + 0.42, fields, ha='left', va='center', fontsize=7.6, zorder=3)

    def rel(a, b, label='1 : N'):
        x1, y1 = ents[a][0] + 1.15, ents[a][1] + 0.6
        x2, y2 = ents[b][0] + 1.15, ents[b][1] + 0.6
        ax.plot([x1, x2], [y1, y2], color='#6b7280', lw=0.9, zorder=1)
        if label:
            ax.text((x1 + x2) / 2, (y1 + y2) / 2, label, fontsize=7.5, ha='center', va='center',
                    bbox=dict(fc='white', ec='none', pad=0.5), zorder=3)

    for a, b, label in [('org', 'dept', '1 : N'), ('org', 'user', '1 : N'), ('org', 'proj', '1 : N'),
                        ('proj', 'task', '1 : N'), ('user', 'task', '1 : N'), ('org', 'layout', ''),
                        ('tmpl', 'run', '1 : N'), ('run', 'task', 'үүсгэнэ'), ('user', 'worklog', '1 : N'),
                        ('layout', 'run', 'бүс'), ('worklog', 'checkin', '')]:
        rel(a, b, label)
    ax.text(5.5, -0.2, 'Бусад хүснэгт: notifications, attachments, expenses, time_entries, daily_goals, '
            'monthly_report_closes,\nmonthly_summaries, assessment_templates, assessment_responses, '
            'five_s_guidelines, five_s_layout_versions, invitations, audit_log',
            ha='center', va='top', fontsize=8, color='#374151')
    save(fig, 'er.png')


# 4. 5S аудитын алгоритм
def audit_flow():
    fig, ax = canvas(7.6, 9.6)
    ax.set_ylim(-0.3, 9.6)
    steps = [
        (8.9, 'Эхлэл: талбайн QR шошгыг уншуулна', GREEN),
        (7.95, 'Бүсийн шалгах хуудас, стандарт зургийг ачаална', GREY),
        (7.0, 'Асуулт бүрт хариулна (оноо 0–5, тийм/үгүй, текст)', GREY),
        (6.05, 'Оноо = Σ авсан / Σ боломжит × 100', BLUE),
        (5.1, 'Сервер рүү илгээж чадсан уу?', AMBER),
        (4.15, 'Хадгалж, бүсийн сүүлийн оноог шинэчилнэ', GREY),
        (3.2, 'Оноо < 85% ?', AMBER),
        (2.15, 'Засах ажил үүсгэнэ: хариуцагч = бүсийн эзэн,\nхугацаа +7 хоног, оноо < 70% бол өндөр чухал', GREY),
        (1.1, 'Хариуцагчид мэдэгдэл илгээнэ', GREEN),
        (0.2, 'Төгсгөл', GREEN),
    ]
    for y, t, c in steps:
        box(ax, 1.1, y - 0.33, 5.4, 0.66, t, c, INK, 9)
    for (y1, *_), (y2, *_) in zip(steps, steps[1:]):
        arrow(ax, 3.8, y1 - 0.33, 3.8, y2 + 0.33)
    ax.text(3.9, 4.6, 'тийм', fontsize=8)
    ax.text(3.9, 2.65, 'тийм', fontsize=8)
    # сүлжээгүй -> outbox
    box(ax, 6.75, 4.75, 0.8, 0.7, 'Утсанд\nхүлээлгэнэ', AMBER, INK, 6.8)
    ax.annotate('', xy=(6.75, 5.1), xytext=(6.5, 5.1), arrowprops=dict(arrowstyle='-|>', color=INK))
    ax.text(6.45, 5.5, 'үгүй', fontsize=7.5)
    # оноо хангалттай -> төгсгөл
    ax.plot([1.1, 0.5, 0.5], [3.2, 3.2, 0.2], color=INK, lw=1.1)
    ax.annotate('', xy=(1.1, 0.2), xytext=(0.5, 0.2), arrowprops=dict(arrowstyle='-|>', color=INK))
    ax.text(0.6, 3.3, 'үгүй', fontsize=8)
    save(fig, 'audit_flow.png')


# 5. Offline outbox
def outbox():
    fig, ax = canvas(10, 4.4)
    box(ax, 0.2, 1.6, 1.9, 1.0, 'Хэрэглэгч\nхадгална', GREEN, INK, 9)
    box(ax, 2.8, 1.6, 1.9, 1.0, 'Сервер рүү\nилгээнэ', GREY, INK, 9)
    box(ax, 5.5, 2.95, 2.0, 0.9, 'Амжилттай', GREEN, INK, 9)
    box(ax, 5.5, 1.65, 2.0, 0.9, 'Огт хүрээгүй\n(сүлжээгүй)', AMBER, INK, 9)
    box(ax, 5.5, 0.35, 2.0, 0.9, 'Сервер татгалзсан\nэсвэл timeout', '#fee2e2', '#b91c1c', 8.5)
    box(ax, 8.1, 1.65, 1.7, 0.9, 'Outbox дараалал\n(утсанд)', AMBER, INK, 9)
    arrow(ax, 2.1, 2.1, 2.8, 2.1)
    arrow(ax, 4.7, 2.3, 5.5, 3.35)
    arrow(ax, 4.7, 2.1, 5.5, 2.1)
    arrow(ax, 4.7, 1.9, 5.5, 0.85)
    arrow(ax, 7.5, 2.1, 8.1, 2.1)
    ax.plot([8.95, 8.95, 3.75], [2.55, 4.1, 4.1], color=BLUE_E, lw=1.1)
    ax.annotate('', xy=(3.75, 2.6), xytext=(3.75, 4.1), arrowprops=dict(arrowstyle='-|>', color=BLUE_E, lw=1.1))
    ax.text(6.4, 4.2, 'сүлжээ сэргэх · апп дахин нээгдэх · «Одоо илгээх»', fontsize=8, ha='center', color=BLUE_E)
    ax.text(7.65, 0.55, 'хэрэглэгчид хэлнэ;\nдахин илгээхгүй', fontsize=8)
    save(fig, 'outbox.png')


# 6. PDCA мөчлөг ба системийн модулиуд
def pdca():
    from matplotlib.patches import Wedge
    fig, ax = canvas(10, 7.6)
    cx, cy, r = 5.0, 3.8, 2.6
    parts = [
        (90, 180, '#dbeafe', '#1d4ed8', 'PLAN\nТөлөвлөх', 'Төсөл, ажил оноох,\n5S талбай, аудитын хуваарь', (-1, 1)),
        (180, 270, '#dcfce7', '#15803d', 'DO\nХийх', 'Ажил гүйцэтгэх, өдрийн бүртгэл,\nутаснаас аудит, улаан шошго', (-1, -1)),
        (270, 360, '#fef3c7', '#b45309', 'CHECK\nШалгах', 'Аудитын оноо, KPI, өглөөний хурал,\nсарын тайлан', (1, -1)),
        (0, 90, '#fce7f3', '#be185d', 'ACT\nСайжруулах', 'Засах ажил, Gemba-гийн алхам,\nсанаа, стандарт шинэчлэх', (1, 1)),
    ]
    import math
    for a1, a2, fc, ec, head, body, (sx, sy) in parts:
        ax.add_patch(Wedge((cx, cy), r, a1, a2, width=1.25, fc=fc, ec='white', lw=3))
        mid = math.radians((a1 + a2) / 2)
        ax.text(cx + math.cos(mid) * (r - 0.62), cy + math.sin(mid) * (r - 0.62), head, ha='center', va='center',
                fontsize=10.5, fontweight='bold', color=ec)
        tx = cx + sx * (r + 0.35)
        ty = cy + sy * (r * 0.72)
        ax.text(tx, ty, body, ha='left' if sx > 0 else 'right', va='center', fontsize=9, color=INK)
    ax.text(cx, cy + 0.18, 'Тасралтгүй', ha='center', va='center', fontsize=10, fontweight='bold')
    ax.text(cx, cy - 0.22, 'сайжруулалт', ha='center', va='center', fontsize=10, fontweight='bold')
    # P (зүүн дээд) → D (зүүн доод) → C (баруун доод) → A (баруун дээд): цагийн зүүний эсрэг
    for a in (180, 270, 0, 90):
        m = math.radians(a)
        ax.annotate('', xy=(cx + math.cos(m + 0.3) * (r + 0.15), cy + math.sin(m + 0.3) * (r + 0.15)),
                    xytext=(cx + math.cos(m - 0.3) * (r + 0.15), cy + math.sin(m - 0.3) * (r + 0.15)),
                    arrowprops=dict(arrowstyle='-|>', color='#475569', lw=1.6, connectionstyle='arc3,rad=0.25'))
    ax.set_xlim(-0.8, 10.8)
    ax.set_aspect('equal')
    save(fig, 'pdca.png')


# 7. Байршуулалтын диаграмм (Docker Compose)
def deployment():
    fig, ax = canvas(12, 6.8)
    ax.add_patch(FancyBboxPatch((3.0, 0.4), 8.7, 6.0, boxstyle='round,pad=0,rounding_size=0.12',
                                fc='#f8fafc', ec='#475569', lw=1.3, ls='--'))
    ax.text(3.2, 6.1, 'Сервер (Linux, Docker Compose)', fontsize=10, fontweight='bold', color='#334155')
    box(ax, 0.2, 4.4, 2.2, 1.2, 'Хөтөч\n(вэб апп)', BLUE, BLUE_E, 9.5)
    box(ax, 0.2, 1.9, 2.2, 1.2, 'Гар утас\n(Flutter апп)', BLUE, BLUE_E, 9.5)
    box(ax, 3.5, 4.1, 2.4, 1.5, 'admin-web\nnginx: статик файл,\n/api → backend', GREY, INK, 8.8)
    box(ax, 6.6, 2.8, 2.4, 1.6, 'backend\nNestJS API :3000\ncron үйлдлүүд', GREY, INK, 8.8)
    box(ax, 9.4, 4.6, 2.1, 1.2, 'postgres\n(15-alpine)', AMBER, '#b45309', 9)
    box(ax, 9.4, 2.9, 2.1, 1.2, 'backup\n(сонголтоор)', '#f1f5f9', '#64748b', 8.8)
    box(ax, 9.4, 0.8, 2.1, 1.2, 'attachments\nvolume', AMBER, '#b45309', 9)
    box(ax, 6.6, 0.8, 2.4, 1.2, 'prometheus, grafana\n(сонголтоор)', '#f1f5f9', '#64748b', 8.5)
    box(ax, 3.5, 0.8, 2.4, 1.2, 'redis\n(сонголтоор)', '#f1f5f9', '#64748b', 9)
    arrow(ax, 2.4, 5.0, 3.5, 5.0, 'HTTPS')
    arrow(ax, 2.4, 2.5, 6.6, 3.2, 'HTTPS /api')
    arrow(ax, 5.9, 4.5, 6.6, 4.1, '')
    arrow(ax, 9.0, 4.2, 9.4, 5.0, 'SQL', both=True)
    arrow(ax, 10.45, 4.1, 10.45, 4.6, '')
    arrow(ax, 8.7, 2.8, 9.4, 1.6, '', both=True)
    arrow(ax, 7.8, 2.0, 7.8, 2.8, 'metrics')
    arrow(ax, 6.6, 3.0, 5.9, 1.8, '', both=True)
    save(fig, 'deployment.png')


if __name__ == '__main__':
    pdca()
    deployment()
    usecase_diagram()
    architecture()
    er_diagram()
    audit_flow()
    outbox()
    print('figures ok')
