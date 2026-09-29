# Дипломын LaTeX төсөл (MUST-Thesis загвар)

Overleaf-д ажиллуулах:
1. Энэ хавтсыг zip болгоно (`diplom-latex.zip` бэлэн байгаа).
2. Overleaf → New Project → Upload Project → zip-ээ сонгоно.
3. Menu → Compiler: **pdfLaTeX**, Main document: **main.tex**.
4. Recompile.

Засах шаардлагатай газрууд:
- `main.tex` — [Овог Нэр], [О.Нэр], удирдагч, зөвлөгч, шүүмжлэгч, и-мэйл.
- `FrontBackMatter/Acknowledgments.tex` — багш нарын нэр.
- `Chapters/Chapter1.tex` 1.3 — хэрэглэгчийн судалгааны үр дүн (TODO).
- `Chapters/Chapter4.tex` — эдийн засгийн тооцооны таамаглал (бодит тоогоор шинэчлэх).
- `Appendices/summary.tex` — Үзлэг 3-ын дараа дүгнэлт.

Диаграмуудыг дахин үүсгэх: `docs/diploma/make_figures.py`, `make_uml.py`.
