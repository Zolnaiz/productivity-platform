%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% Их сургуулийн оюутны тезис
% Класс файл
% Version 1.4 (25/3/16)
%
% Класс файлын эхийг дараах сайтаас авсан.
% http://www.LaTeXTemplates.com
%
% Классыг зохиогч:
% Vel (vel@latextemplates.com)
% Johannes Böttcher
%
% Санамж:
% 1) Энэ класс файл загвар файлын (main.tex) бүтэц, хэлбэрийг тодорхойлно.
% 2) Танд хэрэгтэй ихэнхи тохиолдлыг хангахаар бичигдсэн тул засварлах
% хэрэггүй байх. Засахад хэцүү. Хэрэв засах бол файлын нэрийг өөрчлөөд, өөрчлөлтдөө тайлбар нэмэх хэрэгтэй.
%
% Классын лиценз:
% LPPL v1.3c (http://www.latex-project.org/lppl)
%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

%-------------------------------------------------------------------------------
%	CLASS DEFINITION AND PARAMETERS
%-------------------------------------------------------------------------------

\NeedsTeXFormat{LaTeX2e}[1996/12/01]
\newcommand{\classname}{MUST-Thesis}
\ProvidesClass{\classname}[2016/03/25 v1.4 LaTeXTemplates.com]
\providecommand{\baseclass}{book}

\RequirePackage{etoolbox}
\RequirePackage{xparse}
\newbool{nolistspace}
\newbool{chapteroneline}
\newbool{listtoc}
\newbool{toctoc}
\newbool{parskip}
\newbool{hyperrefsupport}
\booltrue{hyperrefsupport}
\newbool{headsepline}

\DeclareOption{nohyperref}{\boolfalse{hyperrefsupport}}
\DeclareOption{nolistspacing}{\booltrue{nolistspace}}
\DeclareOption{liststotoc}{\booltrue{listtoc}}
\DeclareOption{chapterinoneline}{\booltrue{chapteroneline}}
\DeclareOption{toctotoc}{\booltrue{toctoc}}
\DeclareOption{parskip}{\booltrue{parskip}}
\DeclareOption{headsepline}{\booltrue{headsepline}}
\DeclareOption*{\PassOptionsToClass{\CurrentOption}{\baseclass}}

\ProcessOptions\relax

\LoadClass{\baseclass}

%-------------------------------------------------------------------------------
%	CLASS OPTIONS
%-------------------------------------------------------------------------------
\ifbool{parskip}{\RequirePackage{parskip}} % Хэрэв parskip сонголтыг класс руу дамжуулсан бол, parskip багц хэрэг болно

\newcommand{\abovechapterspace}{\vspace*{50pt}}
\patchcmd{\@makechapterhead}{\vspace*{50\p@}}{\abovechapterspace}{}{}
\patchcmd{\@makeschapterhead}{\vspace*{50\p@}}{\abovechapterspace}{}{}
\newcommand{\autodot}{}
\newcommand{\mdtChapapp}{}
\ifbool{chapteroneline}{%
	\patchcmd{\@makechapterhead}{%
		\if@mainmatter
		\huge\bfseries \@chapapp\space \thechapter
		\par\nobreak
		\vskip 20\p@
		\fi
	}{%
		\if@mainmatter
		\Huge\bfseries \mdtChapapp\thechapter\autodot\enspace
		\fi
	}{}{}
}

\ifbool{listtoc}{% Хэрэв liststotoc сонголтыг класс руу дамжуулсан бол, жагсаалтыг гарчигт нэмнэ
	\patchcmd{\listoftables}{\@starttoc{lot}}{%
		\addchaptertocentry{\listtablename}\@starttoc{lot}}{}{}%
	\patchcmd{\listoffigures}{\@starttoc{lof}}{%
		\addchaptertocentry{\listfigurename}\@starttoc{lof}}{}{}%
}

\ifbool{toctoc}{% Хэрэв toctotoc сонголтыг класс руу дамжуулсан бол,хүснэгтийг гарчигт нэмнэ
	\patchcmd{\tableofcontents}{\@starttoc{toc}}{%
		\addchaptertocentry{\contentsname}\@starttoc{toc}}{}{}%
}

\patchcmd{\tableofcontents}{\MakeUppercase}{\MakeMarkcase}{}{}
\patchcmd{\tableofcontents}{\MakeUppercase}{\MakeMarkcase}{}{}
\patchcmd{\listoffigures}{\MakeUppercase}{\MakeMarkcase}{}{}
\patchcmd{\listoffigures}{\MakeUppercase}{\MakeMarkcase}{}{}
\patchcmd{\listoftables}{\MakeUppercase}{\MakeMarkcase}{}{}
\patchcmd{\listoftables}{\MakeUppercase}{\MakeMarkcase}{}{}

% Хэрэв `nolistspacing' сонголтыг авсан бол жагсаалтын мөр хоорондын зай single болж багасна.  spacing. Энэ сонголт баримтын мөр хоорондын зайг onehalfspacing, doublespacing болгож өөрчилсөн үед хэрэгтэй.
\ifbool{nolistspace}{
	\patchcmd{\listoffigures}{%
		\@starttoc{lof}}{%
			\begingroup%
			\singlespace\@starttoc{lof}\endgroup%
		}{}{}%
	\patchcmd{\listoftables}{%
		\@starttoc{lot}}{%
			\begingroup%
			\singlespace\@starttoc{lot}\endgroup%
		}{}{}%
	\patchcmd{\tableofcontents}{%
		\@starttoc{toc}}{%
			\begingroup%
			\singlespace\@starttoc{toc}\endgroup%
		}{}{}%
}{}

% Addchap нь дугааргүй бүлгийг гарчигт оруулахын зэрэгцээ толгой мөрийг засварлана
\ProvideDocumentCommand{\addchap}{ s o m }{%
	\chapter*{#3}%
	\markboth{}{}%
	\IfBooleanTF{#1}{%
	}{%
		\IfNoValueTF{#2}{%
			\addchaptertocentry{#3}%
			\markboth{\MakeMarkcase{#3}}{\MakeMarkcase{#3}}%
		}{%
			\addchaptertocentry{#2}%
			\markboth{\MakeMarkcase{#2}}{\MakeMarkcase{#2}}%
		}%
	}%
}%

\ProvideDocumentCommand{\addsec}{ s o m }{%
	\section*{#3}%
	\markright{}%
	\IfBooleanTF{#1}{%
	}{%
		\IfNoValueTF{#2}{%
			\addcontentsline{toc}{section}{#3}%
			\markright{\MakeMarkcase{#3}}%%
		}{%
			\addcontentsline{toc}{section}{#2}%
			\markright{\MakeMarkcase{#2}}%
		}%
	}%
}%

%-------------------------------------------------------------------------------
%	REQUIRED PACKAGES
%-------------------------------------------------------------------------------

\RequirePackage{setspace} % Мөр хоорондын зайг өөрчлөхөд хэрэгтэй

\RequirePackage{longtable} % Хуудас дамнасан хүснэгтэд хэрэгтэй (таних тэмдэг, товчилсон үгс болон физик тогтмлын хуудсанд ашигладаг)

\RequirePackage{siunitx} % \SI командад хэрэгтэй

\RequirePackage{graphicx} % Зураг оруулахад хэрэгтэй
\graphicspath{{Figures/}{./}} % Зургийг хаанаас оруулахыг заадаг

\RequirePackage{booktabs} % Хүснэгтийг сайхан болгоход хэрэгтэй

\RequirePackage{caption} % (Гарчигийг (зураг) тохируулахад хэрэгтэй
\captionsetup{justification=centerlast,font=small,labelfont=sc,margin=50pt}

%-------------------------------------------------------------------------------

\newcommand{\checktoopen}{% twosided горим идэвхитэй бол агуулгыг дараачийн сондгой хуудсанд хэвлэхээр шилжүүлэх шинэ команд
\if@openright\cleardoublepage\else\clearpage\fi
\ifdef{\phantomsection}{\phantomsection}{}% The \phantomsection command is necessary for hyperref to jump to the correct page
}

\newcommand\bhrule{\typeout{--------------------}}
\newcommand\tttypeout[1]{\bhrule\typeout{\space #1}\bhrule}

\newcommand{\HRule}{\rule{\linewidth}{0.5mm}} % Нүүр хуудсанд шугам татах шинэ команд

\renewcommand{\abovechapterspace}{\vspace*{10pt}} % Бүлгийн толгойн дээрх сул зайг багасгах

\setcounter{tocdepth}{3} % Гарчиг дахь агуулгын гүн
\providecommand\addchaptertocentry[1]{%
\addcontentsline{toc}{chapter}{#1}%
}

\newcommand\myformat{
\titleformat{\chapter}[display]% команд + хэлбэр
{%
\pagecolor{Chapter}
	\normalfont
	\Large
	\filcenter
	\bfseries
} % формат
{%
	\vspace*{\fill}
	\titlerule[1pt]%
	\vspace{1pt}%
	\titlerule
	\vspace{1pc}%
	\LARGE\MakeUppercase{\chaptertitlename}~\thechapter%
}% шошго
{
	1pc
}% зааглагч
{
	\titlerule
	\Huge
} % өмнө нь
[%
	\vspace*{\fill}
	\thispagestyle{empty}
	\clearpage
	\addtocounter{page}{-1}
\pagecolor{white}
]% дараа нь

}

\newcommand\defformat{
\titleformat{\chapter}[display]
{\normalfont\huge\bfseries}{\chaptertitlename\ \thechapter}{20pt}{\Huge}
}
%-------------------------------------------------------------------------------
%	MARGINS SETTINGS
%-------------------------------------------------------------------------------

\RequirePackage{geometry}

\geometry{
	headheight=4ex,
	paper=a4paper, % Цаасны хэмжээ
	inner=3.0cm, % Дотоод зай
	outer=1.5cm, % Гадаад зай
	bindingoffset=0cm, % Үдэлтийн зай
	top=2.0cm, % Дээд зай
	bottom=2.0cm, % Доод зай
	footskip=1.0cm,
	%showframe,% Хуудасны хүрээг харуулах
}
\raggedbottom

%-------------------------------------------------------------------------------
%	PENALTIES
%-------------------------------------------------------------------------------

\doublehyphendemerits=10000 % No consecutive line hyphens
\brokenpenalty=10000 % No broken words across columns/pages
\widowpenalty=9999 % Almost no widows at bottom of page
\clubpenalty=9999 % Almost no orphans at top of page
\interfootnotelinepenalty=9999 % Almost never break footnotes

%-------------------------------------------------------------------------------
%	HEADERS AND FOOTERS
%-------------------------------------------------------------------------------

\RequirePackage[markcase=used]{scrlayer-scrpage}
\providepairofpagestyles{thesisSimple}{%
\clearpairofpagestyles%
\automark[chapter]{chapter}
\ihead{\leftmark}% Дотоод толгой
%\ohead{\rightmark}% Гадаад толгой
\cfoot[\pagemark]{\pagemark}% Дунд хөл
}
\ifoot{}% Дотоод хөл
\ofoot{}% Гадаад хөл

\pagestyle{thesisSimple}
\providepairofpagestyles[thesisSimple]{thesis}{%
\automark*[section]{}%
}
\providepairofpagestyles[thesisSimple]{review}{%
	\ofoot[\ttitle/\authorname]{\ttitle/\authorname}
	\ifoot[\today]{\today}
}
\pagestyle{thesis}
\ifbool{headsepline}{\KOMAoption{headsepline}{true}}{}
\PreventPackageFromLoading[\ClassError{\classname}{Package `fancyhdr' is
incompatible\MessageBreak with this class}{The pagesyles are defined 
using package `scrlayer-scrpage', please consult the\MessageBreak 
KOMA-script documentation for details.}]{fancyhdr}


\newcommand{\blank@p@gestyle}{empty}
\newcommand{\blankpagestyle}[1]{\def\blank@p@gestyle{#1}}

\def\cleardoublepage{\clearpage\if@twoside \ifodd\c@page\else
\hbox{}
\thispagestyle{\blank@p@gestyle}
\newpage
\if@twocolumn\hbox{}\newpage\fi\fi\fi}

%-------------------------------------------------------------------------------
%	DEFINE CUSTOM THESIS INFORMATION COMMANDS
%-------------------------------------------------------------------------------

\def\ttitle{}
\newcommand*{\supervisor}[1]{\def\supname{#1}}
\newcommand*{\thesistitle}[1]{\def\@title{#1}\def\ttitle{#1}}
\newcommand*{\thesistype}[1]{\def\thesisname{#1}}
\newcommand*{\reader}[1]{\def\readname{#1}}
\newcommand*{\advisor}[1]{\def\advicename{#1}}
\newcommand*{\degreeind}[1]{\def\degreeid{#1}}
\newcommand*{\degree}[1]{\def\degreename{#1}}
\newcommand*{\authorshort}[1]{\def\shortname{#1}}
\newcommand*{\authorlong}[1]{\def\longname{#1}}
\newcommand*{\addresses}[1]{\def\addressname{#1}}
\newcommand*{\university}[1]{\def\univname{#1}}
\newcommand*{\department}[1]{\def\deptname{#1}}
\newcommand*{\deptchair}[1]{\def\chairname{#1}}
\newcommand*{\group}[1]{\def\groupname{#1}}
\newcommand*{\faculty}[1]{\def\facname{#1}}
\newcommand*{\subject}[1]{\def\subjectname{#1}}
\newcommand*{\keywords}[1]{\def\keywordnames{#1}}

%-------------------------------------------------------------------------------
%	DECLARATION PAGE DESIGN
%-------------------------------------------------------------------------------

\newenvironment{declaration}{
	\checktoopen
	\tttypeout{\authorshipname}
	\thispagestyle{plain}
	\null\vfil
	{\noindent\huge\bfseries\authorshipname\par\vspace{10pt}}
}{}

%-------------------------------------------------------------------------------
%	DEDICATION PAGE DESIGN
%-------------------------------------------------------------------------------

\newcommand\dedicatory[1]{
	\checktoopen
	\tttypeout{Dedicatory}
	\null\vfil
	\thispagestyle{plain}
	\begin{center}{\Large\slshape #1}\end{center}
	\vfil\null
}

%-------------------------------------------------------------------------------
%	ABSTRACT PAGE DESIGN
%-------------------------------------------------------------------------------

\newenvironment{abstract}{
	\checktoopen
	\tttypeout{\abstractname}
	\null\vfil
	\thispagestyle{plain}
	\begin{center}
	{\scshape\Large \univname\par} % Их сургуулийн нэр
	{\scshape\large \facname\par}\vspace{0.5cm} % Их сургуулийн нэр
	{\huge\textbf{{\abstractname}} \par}
	\bigskip \
	{\normalsize \Large{\@title} \par} % Тезисийн нэр
	\medskip
	{\normalsize \shortname \par} \\ % Зохиогчийн нэр
	\addressname
	\end{center}
}

%-------------------------------------------------------------------------------
%	ABBREVIATIONS PAGE DESIGN
%-------------------------------------------------------------------------------

\NewDocumentEnvironment{abbreviations}{ m }{%
	\ifbool{nolistspace}{\begingroup\singlespacing}{}
	\ifbool{listtoc}{\addchap{\abbrevname}}{\addchap*{\abbrevname}}
	\begin{longtable}{#1}
}{
\end{longtable}
\addtocounter{table}{-1} % Don't count this table as one of the document tables
\ifbool{nolistspace}{\endgroup}{}
}

%-------------------------------------------------------------------------------
%	PHYSICAL CONSTANTS PAGE DESIGN
%-------------------------------------------------------------------------------

\NewDocumentEnvironment{constants}{ m }{%
	\ifbool{nolistspace}{\begingroup\singlespacing}{}
	\ifbool{listtoc}{\addchap{\constantsname}}{\addchap*{\constantsname}}
	\begin{longtable}{#1}
	}{%
\end{longtable}
\addtocounter{table}{-1} % Don't count this table as one of the document tables
\ifbool{nolistspace}{\endgroup}{}
}

%-------------------------------------------------------------------------------
%	SYMBOLS PAGE DESIGN
%-------------------------------------------------------------------------------

\NewDocumentEnvironment{symbols}{ m }{%
	\ifbool{nolistspace}{\begingroup\singlespacing}{}
	\ifbool{listtoc}{\addchap{\symbolsname}}{\addchap*{\symbolsname}}
	\begin{longtable}{#1}
	}{%
	\end{longtable}
	\addtocounter{table}{-1} % Don't count this table as one of the document tables
	\ifbool{nolistspace}{\endgroup}{}
}

%-------------------------------------------------------------------------------
%	ACKNOWLEDGEMENTS PAGE DESIGN
%-------------------------------------------------------------------------------

\NewDocumentEnvironment{acknowledgements}{}{%
\checktoopen
\tttypeout{\acknowledgementname}
\thispagestyle{plain}
\begin{center}{\huge \textbf{{\acknowledgementname}}\par}\end{center}
}
{
\vfil\vfil\null
}

%-------------------------------------------------------------------------------

\ifbool{hyperrefsupport}{% If the nohyperref class option has not been specified
\AfterPackage{biblatex}{ % Load the hyperref package after the biblatex package for compatibility 
\RequirePackage{hyperref} % Required for customising links and the PDF
\hypersetup{pdfpagemode={UseOutlines},
bookmarksopen=true,
bookmarksopenlevel=0,
hypertexnames=false,
colorlinks=true, % Set to false to disable coloring links
citecolor=magenta, % The color of citations
linkcolor=red, % The color of references to document elements (sections, figures, etc)
urlcolor=black, % The color of hyperlinks (URLs)
pdfstartview={FitV},
unicode,
breaklinks=true,
}

\pdfstringdefDisableCommands{% If there is an explicit linebreak in a section heading (or anything printed to the pdf-bookmarks), it is replaced by a space
   \let\\\space%
}
}
}{%nothing
}

%-------------------------------------------------------------------------------

\endinput
% lazyLizardTracer
