"""Дипломын бичвэрийн диаграмууд. python make_figures.py -> fig/*.png"""
import os

import matplotlib

matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Ellipse, FancyBboxPatch, Rectangle

plt.rcParams['font.family'] = 'Arial'
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'fig')
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


# 1. Use-case диаграм
def usecase_diagram():
    fig, ax = canvas(11, 9.4)
    ax.add_patch(Rectangle((2.2, 0.2), 6.6, 9.0, fc='white', ec=INK, lw=1.4))
    ax.text(5.5, 9.0, 'Бүтээмжийн платформ', ha='center', fontsize=11, fontweight='bold')
    cases = {
        'login': (5.5, 8.45, 'Нэвтрэх'),
        'tasks': (4.0, 7.75, 'Өөрийн ажлыг харах, дуусгах'),
        'worklog': (4.0, 7.05, 'Өдрийн бүртгэл хөтлөх'),
        'checkin': (4.0, 6.35, 'Долоо хоногийн тайлан бичих'),
        'audit': (4.0, 5.65, '5S аудит хийх (QR)'),
        'redtag': (4.0, 4.95, 'Улаан шошго бүртгэх'),
        'idea': (4.0, 4.25, 'Сайжруулалтын санаа илгээх'),
        'inbox': (4.0, 3.55, 'Мэдэгдэл унших'),
        'archive': (4.0, 2.05, 'Тайлан, архив үзэх'),
        'assign': (7.0, 7.4, 'Ажил оноох, хянах'),
        'huddle': (7.0, 6.7, 'Өглөөний хурал хөтлөх'),
        'gemba': (7.0, 6.0, 'Gemba явалт бүртгэх'),
        'review': (7.0, 5.3, 'Санаа хянах'),
        'report': (7.0, 4.6, 'Сарын тайлан хаах, батлах'),
        'layout': (7.0, 3.9, '5S талбайн зураг, стандарт'),
        'users': (7.0, 2.4, 'Хэрэглэгч урих, эрх олгох'),
        'org': (7.0, 1.7, 'Байгууллагын тохиргоо'),
        'remind': (5.5, 0.75, 'Сануулга, аудит төлөвлөх'),
    }
    for x, y, t in cases.values():
        usecase(ax, x, y, t)
    actor(ax, 0.9, 6.2, 'Ажилтан')
    actor(ax, 0.9, 2.6, 'Ажиглагч')
    actor(ax, 10.1, 6.2, 'Менежер')
    actor(ax, 10.1, 2.4, 'Админ')
    actor(ax, 10.1, 0.5, 'Цагийн хуваарь')
    line = dict(color='#6b7280', lw=0.8)
    for k in ['tasks', 'worklog', 'checkin', 'audit', 'redtag', 'idea', 'inbox', 'login']:
        x, y, _ = cases[k]
        ax.plot([1.15, x - 1.35], [6.35, y], **line)
    for k in ['archive', 'inbox']:
        x, y, _ = cases[k]
        ax.plot([1.15, x - 1.35], [2.75, y], **line)
    for k in ['assign', 'huddle', 'gemba', 'review', 'report', 'layout']:
        x, y, _ = cases[k]
        ax.plot([9.85, x + 1.35], [6.35, y], **line)
    for k in ['users', 'org']:
        x, y, _ = cases[k]
        ax.plot([9.85, x + 1.35], [2.55, y], **line)
    x, y, _ = cases['remind']
    ax.plot([9.85, x + 1.25], [0.65, y], **line)
    # Эрхийн удамшил: админ ⊃ менежер ⊃ ажилтан ⊃ ажиглагч
    ax.annotate('', xy=(10.1, 5.3), xytext=(10.1, 3.4), arrowprops=dict(arrowstyle='-|>', color=INK, lw=1, ls='--'))
    ax.text(10.3, 4.35, 'өвлөнө', fontsize=8, rotation=90, va='center')
    ax.annotate('', xy=(0.9, 3.7), xytext=(0.9, 5.3), arrowprops=dict(arrowstyle='-|>', color=INK, lw=1, ls='--'))
    ax.text(0.55, 4.5, 'өвлөнө', fontsize=8, rotation=90, va='center')
    save(fig, 'usecase.png')


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
    box(ax, 8.6, 3.5, 2.2, 1.4, 'PostgreSQL\n25 хүснэгт\n40 migration', AMBER, '#b45309', 9.5)
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


if __name__ == '__main__':
    usecase_diagram()
    architecture()
    er_diagram()
    audit_flow()
    outbox()
    print('figures ok')
