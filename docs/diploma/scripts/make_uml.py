"""UML диаграмууд: класс, дараалал, үйл ажиллагаа. python make_uml.py -> fig/*.png"""
import os

import matplotlib

matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Rectangle, Polygon

plt.rcParams['font.family'] = 'Arial'
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'fig')
INK = '#1f2937'
HEAD = '#dbeafe'
GREY = '#6b7280'


def canvas(w, h):
    fig, ax = plt.subplots(figsize=(w, h))
    ax.set_xlim(0, w)
    ax.set_ylim(0, h)
    ax.axis('off')
    return fig, ax


def save(fig, name):
    fig.savefig(os.path.join(OUT, name), dpi=200, bbox_inches='tight', facecolor='white')
    plt.close(fig)


# ---------------------------------------------------------------- класс
def uml_class(ax, x, y, name, attrs, methods=(), w=2.6, size=7.6):
    """(x, y) нь дээд зүүн булан. Доод ирмэгийн y-г буцаана."""
    line = 0.2
    head = 0.34
    h_attr = line * max(len(attrs), 1) + 0.1
    h_meth = line * len(methods) + 0.1 if methods else 0
    total = head + h_attr + h_meth
    ax.add_patch(Rectangle((x, y - total), w, total, fc='white', ec=INK, lw=1, zorder=2))
    ax.add_patch(Rectangle((x, y - head), w, head, fc=HEAD, ec=INK, lw=1, zorder=2))
    ax.text(x + w / 2, y - head / 2, name, ha='center', va='center', fontsize=size + 1, fontweight='bold', zorder=3)
    for i, a in enumerate(attrs):
        ax.text(x + 0.08, y - head - 0.14 - i * line, a, fontsize=size, va='center', zorder=3)
    if methods:
        top = y - head - h_attr
        ax.plot([x, x + w], [top, top], color=INK, lw=1, zorder=3)
        for i, m in enumerate(methods):
            ax.text(x + 0.08, top - 0.14 - i * line, m, fontsize=size, va='center', zorder=3)
    return (x, y, w, total)


def centre(box):
    x, y, w, h = box
    return x + w / 2, y - h / 2


def edge(box, side):
    x, y, w, h = box
    return {'l': (x, y - h / 2), 'r': (x + w, y - h / 2), 't': (x + w / 2, y), 'b': (x + w / 2, y - h)}[side]


def assoc(ax, a, sa, b, sb, m1='', m2='', label='', dashed=False, arrow=None):
    (x1, y1), (x2, y2) = edge(a, sa), edge(b, sb)
    ax.plot([x1, x2], [y1, y2], color=GREY, lw=0.9, ls='--' if dashed else '-', zorder=1)
    if arrow:
        ax.annotate('', xy=(x2, y2), xytext=(x1 + (x2 - x1) * 0.85, y1 + (y2 - y1) * 0.85),
                    arrowprops=dict(arrowstyle=arrow, color=GREY, lw=0.9))
    def near(px, py, qx, qy, t=0.12):
        return px + (qx - px) * t, py + (qy - py) * t
    if m1:
        px, py = near(x1, y1, x2, y2)
        ax.text(px + 0.08, py + 0.08, m1, fontsize=7, color=INK)
    if m2:
        px, py = near(x2, y2, x1, y1)
        ax.text(px + 0.08, py + 0.08, m2, fontsize=7, color=INK)
    if label:
        ax.text((x1 + x2) / 2, (y1 + y2) / 2, label, fontsize=7, ha='center', va='center', style='italic',
                bbox=dict(fc='white', ec='none', pad=0.5))


def class_analysis():
    fig, ax = canvas(13, 10)
    org = uml_class(ax, 5.2, 9.8, 'Organization', ['- id: UUID', '- name: string', '- code: string',
                                                   '- settings: JSON'], ['+ clock(): TimeZone'])
    dept = uml_class(ax, 0.3, 9.8, 'Department', ['- id: UUID', '- name: string'])
    user = uml_class(ax, 0.3, 7.4, 'User', ['- id: UUID', '- email: string', '- role: UserRole',
                                             '- departmentId', '- isActive: bool'],
                     ['+ can(permission): bool'])
    proj = uml_class(ax, 10.2, 9.8, 'Project', ['- id: UUID', '- name: string', '- status', '- progress: int',
                                                '- dueDate: date'])
    task = uml_class(ax, 5.2, 7.0, 'Task', ['- id: UUID', '- title: string', '- status: TaskStatus',
                                            '- priority', '- dueDate: date', '- sourceType, sourceId',
                                            '- completedAt'], ['+ isLate(today): bool', '+ complete()'])
    layout = uml_class(ax, 10.2, 7.2, 'FiveSLayout', ['- id: UUID', '- zones: Zone[]', '- auditTiers',
                                                     '- version'], ['+ zoneOf(id): Zone'])
    tmpl = uml_class(ax, 10.2, 4.6, 'AuditTemplate', ['- id: UUID', '- title: string', '- questions: Question[]'],
                     ['+ score(answers): int'])
    run = uml_class(ax, 5.2, 3.9, 'AuditRun', ['- id: UUID', '- zoneId', '- answers: Answer[]', '- score: int',
                                               '- status'], ['+ needsFollowUp(): bool'])
    worklog = uml_class(ax, 0.3, 4.7, 'WorkLog', ['- userId', '- day: date', '- done, next: text'])
    checkin = uml_class(ax, 0.3, 3.0, 'WeeklyCheckin', ['- userId', '- week: date', '- plans, problems'])
    idea = uml_class(ax, 5.2, 1.2, 'Idea', ['- authorId', '- title', '- status', '- reviewNote'])
    gemba = uml_class(ax, 10.2, 2.2, 'GembaWalk', ['- walkerId', '- walkedOn: date', '- observations',
                                                  '- followUps[]'])
    notif = uml_class(ax, 0.3, 1.2, 'Notification', ['- userId', '- title, body', '- link', '- readAt'])
    assoc(ax, org, 'l', dept, 'r', '1', '*')
    assoc(ax, org, 'b', task, 't', '1', '*')
    assoc(ax, org, 'r', proj, 'l', '1', '*')
    assoc(ax, dept, 'b', user, 't', '1', '*')
    assoc(ax, user, 'r', task, 'l', '1', '*', 'хариуцна')
    assoc(ax, proj, 'b', layout, 't', '', '', '')
    assoc(ax, proj, 'l', task, 'r', '0..1', '*')
    assoc(ax, layout, 'l', run, 'r', '1', '*', 'бүс')
    assoc(ax, tmpl, 'l', run, 'r', '1', '*')
    assoc(ax, run, 't', task, 'b', '1', '0..1', 'үүсгэнэ', arrow='-|>')
    assoc(ax, user, 'b', worklog, 't', '1', '*')
    assoc(ax, worklog, 'b', checkin, 't', '', '', 'нэгтгэнэ', dashed=True)
    assoc(ax, idea, 't', run, 'b', '', '', '')
    assoc(ax, gemba, 'l', run, 'r', '', '', '')
    assoc(ax, user, 'b', notif, 't', '', '', '')
    save(fig, 'class_analysis.png')


def class_analysis_clean():
    """Шинжилгээний класс диаграмм, илүүц холбоосгүй."""
    fig, ax = canvas(13, 10.4)
    org = uml_class(ax, 5.2, 10.2, 'Organization', ['- id: UUID', '- name: string', '- code: string',
                                                    '- settings: JSON'], ['+ clock(): TimeZone'])
    dept = uml_class(ax, 0.3, 10.2, 'Department', ['- id: UUID', '- name: string'])
    proj = uml_class(ax, 10.2, 10.2, 'Project', ['- id: UUID', '- name: string', '- status', '- progress: int',
                                                 '- dueDate: date'])
    user = uml_class(ax, 0.3, 7.8, 'User', ['- id: UUID', '- email: string', '- role: UserRole',
                                             '- departmentId', '- isActive: bool'], ['+ can(permission): bool'])
    task = uml_class(ax, 5.2, 7.6, 'Task', ['- id: UUID', '- title: string', '- status: TaskStatus',
                                            '- priority', '- dueDate: date', '- sourceType, sourceId',
                                            '- completedAt'], ['+ isLate(today): bool', '+ complete()'])
    layout = uml_class(ax, 10.2, 7.4, 'FiveSLayout', ['- id: UUID', '- zones: Zone[]', '- auditTiers',
                                                     '- version'], ['+ zoneOf(id): Zone'])
    worklog = uml_class(ax, 0.3, 4.9, 'WorkLog', ['- userId', '- day: date', '- done, next: text'])
    run = uml_class(ax, 5.2, 4.3, 'AuditRun', ['- id: UUID', '- zoneId', '- answers: Answer[]', '- score: int',
                                               '- status'], ['+ needsFollowUp(): bool'])
    tmpl = uml_class(ax, 10.2, 4.7, 'AuditTemplate', ['- id: UUID', '- title: string', '- questions: Question[]'],
                     ['+ score(answers): int'])
    checkin = uml_class(ax, 0.3, 3.2, 'WeeklyCheckin', ['- userId', '- week: date', '- plans, problems'])
    idea = uml_class(ax, 5.2, 1.5, 'Idea', ['- authorId', '- title', '- status', '- reviewNote'])
    gemba = uml_class(ax, 10.2, 2.4, 'GembaWalk', ['- walkerId', '- walkedOn: date', '- observations',
                                                  '- followUps[]'])
    notif = uml_class(ax, 0.3, 1.3, 'Notification', ['- userId', '- title, body', '- link', '- readAt'])
    assoc(ax, org, 'l', dept, 'r', '1', '*')
    assoc(ax, org, 'r', proj, 'l', '1', '*')
    assoc(ax, org, 'b', task, 't', '1', '*')
    assoc(ax, dept, 'b', user, 't', '1', '*')
    assoc(ax, user, 'r', task, 'l', '1', '*', 'хариуцна')
    assoc(ax, layout, 'b', tmpl, 't', '', '', 'аудитын шат')
    assoc(ax, tmpl, 'l', run, 'r', '1', '*')
    assoc(ax, run, 't', task, 'b', '1', '0..1', 'үүсгэнэ', arrow='-|>')
    assoc(ax, user, 'b', worklog, 't', '1', '*')
    assoc(ax, worklog, 'b', checkin, 't', '', '', 'нэгтгэнэ', dashed=True)

    def route(points, label='', lx=None, ly=None):
        xs, ys = zip(*points)
        ax.plot(xs[:-1] + (xs[-1],), ys, color=GREY, lw=0.9, zorder=1)
        ax.annotate('', xy=points[-1], xytext=points[-2], arrowprops=dict(arrowstyle='-|>', color=GREY, lw=0.9))
        if label:
            ax.text(lx, ly, label, fontsize=7, style='italic', ha='center', bbox=dict(fc='white', ec='none', pad=0.5))

    # Санаа батлагдвал, Gemba-гийн дараагийн алхам бүр ажил болно
    ix, iy = edge(idea, 'l')
    route([(ix, iy), (4.75, iy), (4.75, 5.9), (5.2, 5.9)], 'үүсгэнэ', 4.75, 3.0)
    gx, gy = edge(gemba, 'l')
    route([(gx, gy), (9.75, gy), (9.75, 5.6), (7.8, 5.6)], 'үүсгэнэ', 9.75, 2.9)
    # Мэдэгдэл хэрэглэгчид очно
    nx, ny = edge(notif, 'l')
    route([(nx, ny), (0.12, ny), (0.12, 6.9), (0.3, 6.9)], '', 0, 0)
    ax.text(0.2, 0.2, '', fontsize=1)
    save(fig, 'class_analysis.png')


def class_design():
    fig, ax = canvas(13, 7.6)
    ctrl = uml_class(ax, 0.3, 7.3, '«controller»\nOperationsController', [],
                     ['+ createAuditRun(dto)', '+ createTask(dto)', '+ updateTask(id, dto)', '+ getTasks(query)'],
                     w=3.4)
    guard = uml_class(ax, 0.3, 4.4, '«guard»\nPermissionsGuard', ['- rolePermissions: Map'],
                      ['+ canActivate(ctx): bool'], w=3.4)
    jwt = uml_class(ax, 0.3, 2.3, '«guard»\nJwtAuthGuard', [], ['+ canActivate(ctx): bool'], w=3.4)
    svc = uml_class(ax, 4.7, 7.3, '«service»\nOperationsService', ['- tasks: Repository<Task>',
                                                                   '- auditRuns: Repository<AuditRun>'],
                    ['+ createAuditRun(dto, user)', '- correctiveWorkFor(run, user)', '+ createTask(dto, user)',
                     '- findOneScoped(repo, id, user)'], w=3.8)
    notif = uml_class(ax, 4.7, 3.6, '«service»\nNotificationsService', ['- notifications: Repository'],
                      ['+ notify(request)', '+ markRead(id, user)'], w=3.8)
    remind = uml_class(ax, 4.7, 1.6, '«cron»\nDailyReminderService', [], ['+ remind(now)'], w=3.8)
    repo = uml_class(ax, 9.4, 7.3, '«repository»\nRepository<T> (TypeORM)', [],
                     ['+ find(options)', '+ save(entity)', '+ findOne(options)'], w=3.4)
    ent = uml_class(ax, 9.4, 5.0, '«entity»\nTask / AuditRun', ['- organizationId', '- ...'], [], w=3.4)
    db = uml_class(ax, 9.4, 3.2, '«database»\nPostgreSQL', ['25 хүснэгт'], [], w=3.4)
    assoc(ax, ctrl, 'r', svc, 'l', '', '', 'дуудна', arrow='-|>')
    assoc(ax, guard, 't', ctrl, 'b', '', '', 'хамгаална', dashed=True, arrow='-|>')
    assoc(ax, jwt, 't', guard, 'b', '', '', 'дараа нь', dashed=True, arrow='-|>')
    assoc(ax, svc, 'r', repo, 'l', '', '', 'ашиглана', arrow='-|>')
    assoc(ax, svc, 'b', notif, 't', '', '', 'мэдэгдэнэ', arrow='-|>')
    assoc(ax, remind, 't', notif, 'b', '', '', '', arrow='-|>')
    assoc(ax, repo, 'b', ent, 't', '', '', '', dashed=True)
    assoc(ax, ent, 'b', db, 't', '', '', 'map', dashed=True)
    save(fig, 'class_design.png')


# ---------------------------------------------------------------- дараалал
def sequence(name, parts, steps, width=13, title=None):
    n = len(parts)
    rows = len(steps)
    h = 1.6 + rows * 0.55
    fig, ax = canvas(width, h)
    xs = [0.9 + i * (width - 1.8) / (n - 1) for i in range(n)]
    top = h - 0.3
    for x, (label, kind) in zip(xs, parts):
        if kind == 'actor':
            ax.add_patch(plt.Circle((x, top - 0.12), 0.1, fc='white', ec=INK))
            ax.plot([x, x], [top - 0.22, top - 0.45], color=INK, lw=1)
            ax.plot([x - 0.15, x + 0.15], [top - 0.3, top - 0.3], color=INK, lw=1)
            ax.plot([x, x - 0.12], [top - 0.45, top - 0.6], color=INK, lw=1)
            ax.plot([x, x + 0.12], [top - 0.45, top - 0.6], color=INK, lw=1)
            ax.text(x, top - 0.72, label, ha='center', va='top', fontsize=8.5, fontweight='bold')
        else:
            ax.add_patch(FancyBboxPatch((x - 0.9, top - 0.75), 1.8, 0.6, boxstyle='round,pad=0,rounding_size=0.05',
                                        fc=HEAD, ec=INK, lw=1))
            ax.text(x, top - 0.45, label, ha='center', va='center', fontsize=8.2, fontweight='bold')
        ax.plot([x, x], [top - 0.95, 0.2], color=GREY, lw=0.8, ls='--', zorder=0)
    y = top - 1.3
    for step in steps:
        a, b, text = step[0], step[1], step[2]
        style = step[3] if len(step) > 3 else 'call'
        if a == 'frame':
            ax.add_patch(Rectangle((0.3, y - 0.05), width - 0.6, 0.4, fc='#fef3c7', ec='#b45309', lw=0.8, alpha=0.8))
            ax.text(0.4, y + 0.15, text, fontsize=7.8, va='center', color='#78350f', fontweight='bold')
            y -= 0.55
            continue
        x1, x2 = xs[a], xs[b]
        if a == b:
            ax.annotate('', xy=(x1 + 0.05, y - 0.22), xytext=(x1 + 0.05, y),
                        arrowprops=dict(arrowstyle='-|>', color=INK, lw=0.9,
                                        connectionstyle='arc,angleA=0,angleB=0,armA=18,armB=18,rad=0'))
            ax.text(x1 + 0.35, y - 0.1, text, fontsize=7.8, va='center')
        else:
            ax.annotate('', xy=(x2, y), xytext=(x1, y),
                        arrowprops=dict(arrowstyle='-|>' if style == 'call' else '->', color=INK, lw=0.9,
                                        ls='--' if style == 'reply' else '-'))
            ax.text((x1 + x2) / 2, y + 0.06, text, fontsize=7.8, ha='center', va='bottom')
        y -= 0.55
    save(fig, name)


def sequences():
    sequence('seq_login.png', [('Хэрэглэгч', 'actor'), ('Нэвтрэх UI', 'box'), ('AuthController', 'box'),
                               ('AuthService', 'box'), ('UsersRepository', 'box')], [
        (0, 1, 'и-мэйл, нууц үг оруулна'),
        (1, 2, 'POST /api/auth/login'),
        (2, 3, 'login(dto)'),
        (3, 4, 'findByEmail(email)'),
        (4, 3, 'User', 'reply'),
        (3, 3, 'нууц үгийн hash шалгах'),
        ('frame', None, '[алдаатай] 401 AUTH_INVALID_CREDENTIALS буцаана'),
        (3, 3, 'JWT access + refresh токен үүсгэх'),
        (3, 2, 'токен, хэрэглэгч, эрхүүд', 'reply'),
        (2, 1, '200 OK', 'reply'),
        (1, 0, 'нүүр хуудас (Миний өдөр)', 'reply'),
    ])
    sequence('seq_audit.png', [('Ажилтан', 'actor'), ('Гар утасны апп', 'box'), ('Outbox', 'box'),
                               ('OperationsController', 'box'), ('OperationsService', 'box'),
                               ('Notifications', 'box')], [
        (0, 1, 'QR уншуулна'),
        (1, 3, 'GET бүс, шалгах хуудас'),
        (3, 1, 'асуултууд, стандарт зураг', 'reply'),
        (0, 1, 'хариулт, зураг оруулна'),
        (1, 1, 'scoreAnswers() — оноо'),
        (1, 3, 'POST /api/audit-runs'),
        ('frame', None, '[сүлжээгүй] Outbox-д хадгалж, сүлжээ сэргэхэд дахин илгээнэ'),
        (3, 4, 'createAuditRun(dto, user)'),
        (4, 4, 'хадгалах, бүсийн оноо шинэчлэх'),
        ('frame', None, '[оноо < 85%] засах ажил үүсгэнэ'),
        (4, 4, 'correctiveWorkFor(run) → createTask'),
        (4, 5, 'notify(бүсийн эзэн)'),
        (4, 3, 'AuditRun', 'reply'),
        (3, 1, '201 Created', 'reply'),
        (1, 0, 'оноо, үүссэн ажил', 'reply'),
    ])
    sequence('seq_close.png', [('Cron (цаг тутам)', 'box'), ('ReportArchiveService', 'box'), ('Organizations', 'box'),
                               ('MonthlyReport', 'box'), ('monthly_report_closes', 'box'), ('Менежер', 'actor')], [
        (0, 1, 'closePreviousMonth(now)'),
        (1, 2, 'байгууллагуудыг авах'),
        (2, 1, 'цагийн бүс, хаах өдөр', 'reply'),
        ('frame', None, '[байгууллага бүрт] өнөөдөр < хаах өдөр эсвэл аль хэдийн хаасан бол алгасна'),
        (1, 3, 'selectMonthRecords(өнгөрсөн сар, tz)'),
        (3, 1, 'сарын бүртгэлүүд', 'reply'),
        (1, 4, 'хуулбарыг хадгалах (snapshot)'),
        (5, 1, 'GET /api/operations/monthly-report'),
        (1, 3, 'buildMonthlyReport(snapshot)'),
        (1, 5, 'хаагдсан тайлан', 'reply'),
    ])
    sequence('seq_gemba.png', [('Менежер', 'actor'), ('Gemba хуудас', 'box'), ('GembaController', 'box'),
                               ('GembaService', 'box'), ('OperationsService', 'box'), ('Хариуцагч', 'actor')], [
        (0, 1, 'бүс, ажиглалт, яриа, дараагийн алхмууд'),
        (1, 2, 'POST /api/gemba'),
        (2, 2, "шалгах: 'gemba:walk'"),
        (2, 3, 'record(dto, user)'),
        (3, 3, 'явалтыг хадгалах'),
        ('frame', None, '[дараагийн алхам бүрт] хариуцагчгүй бол явалт хийсэн менежерт'),
        (3, 4, 'createTask(source = gemba_walk)'),
        (4, 5, 'мэдэгдэл: танд ажил оноогдлоо'),
        (3, 2, 'явалт + үүссэн ажлууд', 'reply'),
        (2, 1, '201 Created', 'reply'),
        (1, 0, 'долоо хоногийн биелэлт шинэчлэгдэнэ', 'reply'),
    ])
    sequence('seq_task.png', [('Менежер', 'actor'), ('Вэб апп', 'box'), ('PermissionsGuard', 'box'),
                              ('OperationsService', 'box'), ('Notifications', 'box'), ('Ажилтан', 'actor')], [
        (0, 1, 'ажил, хариуцагч, хугацаа'),
        (1, 2, 'POST /api/tasks'),
        (2, 2, "шалгах: 'tasks:create'"),
        ('frame', None, '[эрхгүй] 403 FORBIDDEN'),
        (2, 3, 'createTask(dto, user)'),
        (3, 3, 'давхардал шалгах (sourceType, sourceId)'),
        (3, 4, 'notify(assignee)'),
        (4, 5, '«Танд ажил оноогдлоо»'),
        (3, 1, '201 Task', 'reply'),
        (5, 1, 'төлөв: хийгдэж байна → дууссан (PATCH)'),
        (1, 0, 'явцын самбар шинэчлэгдэнэ', 'reply'),
    ])


# ---------------------------------------------------------------- үйл ажиллагаа
def activity():
    lanes = ['Менежер', 'Систем', 'Ажилтан']
    fig, ax = canvas(12, 11)
    lw = 12 / 3
    for i, lane in enumerate(lanes):
        ax.add_patch(Rectangle((i * lw, 0), lw, 10.4, fc='white', ec=INK, lw=1))
        ax.add_patch(Rectangle((i * lw, 10.4), lw, 0.5, fc=HEAD, ec=INK, lw=1))
        ax.text(i * lw + lw / 2, 10.65, lane, ha='center', va='center', fontsize=10, fontweight='bold')

    def act(lane, y, text, w=3.2):
        x = lane * lw + lw / 2
        ax.add_patch(FancyBboxPatch((x - w / 2, y - 0.3), w, 0.6, boxstyle='round,pad=0,rounding_size=0.25',
                                    fc='#eef2ff', ec=INK, lw=1))
        ax.text(x, y, text, ha='center', va='center', fontsize=8.3)
        return x, y

    def decision(lane, y, text):
        x = lane * lw + lw / 2
        ax.add_patch(Polygon([[x, y + 0.35], [x + 0.5, y], [x, y - 0.35], [x - 0.5, y]], fc='#fef3c7', ec=INK))
        ax.text(x - 0.6, y, text, fontsize=7.8, ha='right', va='center')
        return x, y

    def flow(p, q, label=''):
        (x1, y1), (x2, y2) = p, q
        if abs(x1 - x2) < 0.01:
            ax.annotate('', xy=(x2, y2 + 0.3), xytext=(x1, y1 - 0.3), arrowprops=dict(arrowstyle='-|>', color=INK))
        else:
            ax.annotate('', xy=(x2 - 1.6 if x2 > x1 else x2 + 1.6, y2), xytext=(x1 + (1.6 if x2 > x1 else -1.6), y1),
                        arrowprops=dict(arrowstyle='-|>', color=INK, connectionstyle='angle,angleA=0,angleB=90'))
        if label:
            ax.text((x1 + x2) / 2 + 0.1, (y1 + y2) / 2, label, fontsize=7.5, color='#374151')

    x0 = lw / 2
    ax.add_patch(plt.Circle((x0, 10.0), 0.15, color=INK))
    a1 = act(0, 9.3, 'Ажил үүсгэж, хариуцагч,\nхугацаа онооно')
    ax.annotate('', xy=(x0, 9.6), xytext=(x0, 9.85), arrowprops=dict(arrowstyle='-|>', color=INK))
    a2 = act(1, 8.3, 'Эрх шалгаж, ажлыг хадгална')
    a3 = act(1, 7.3, 'Хариуцагчид мэдэгдэл илгээнэ')
    a4 = act(2, 6.3, 'Утас/вэбээс ажлаа харна')
    a5 = act(2, 5.3, 'Ажлыг гүйцэтгэж,\nтөлөв шинэчилнэ')
    d1 = decision(1, 4.3, 'Хугацаа хэтэрсэн үү?')
    a6 = act(1, 3.3, 'Өглөөний сануулга,\n«хоцорсон» бүлэгт оруулна')
    a7 = act(2, 2.3, 'Ажлыг «дууссан» болгоно')
    a8 = act(1, 1.3, 'completedAt хадгалж,\nсарын тайланд тусгана')
    a9 = act(0, 1.3, 'Явцын самбар, хурал дээр\nүр дүнг харна')
    def path(points, label='', at=None):
        xs, ys = zip(*points)
        ax.plot(xs, ys, color=INK, lw=1.1)
        ax.annotate('', xy=points[-1], xytext=points[-2], arrowprops=dict(arrowstyle='-|>', color=INK, lw=1.1))
        if label:
            ax.text(at[0], at[1], label, fontsize=7.8, color='#374151')

    path([(3.6, 9.3), (6, 9.3), (6, 8.6)])
    path([(6, 8.0), (6, 7.6)])
    path([(7.6, 7.3), (10, 7.3), (10, 6.6)])
    path([(10, 6.0), (10, 5.6)])
    path([(8.4, 5.3), (6, 5.3), (6, 4.65)])
    path([(6, 3.95), (6, 3.6)], 'тийм', (6.1, 3.72))
    path([(6.5, 4.3), (10, 4.3), (10, 2.6)], 'үгүй', (7.0, 4.38))
    path([(7.6, 3.3), (9.2, 3.3), (9.2, 2.6)])
    path([(8.4, 2.3), (6.8, 2.3), (6.8, 1.6)])
    path([(4.4, 1.3), (3.6, 1.3)])
    ax.add_patch(plt.Circle((x0, 0.45), 0.17, fc='white', ec=INK, lw=1.2))
    ax.add_patch(plt.Circle((x0, 0.45), 0.1, color=INK))
    ax.annotate('', xy=(x0, 0.63), xytext=(x0, 1.0), arrowprops=dict(arrowstyle='-|>', color=INK))
    save(fig, 'activity_task.png')


if __name__ == '__main__':
    class_analysis_clean()
    class_design()
    sequences()
    activity()
    print('uml ok')
