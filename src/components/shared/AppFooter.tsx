import { useLanguage, useTranslate } from '@/hooks';
import { withParams, type LanguageCode } from '@/lib/translate';

const REPO_URL = 'https://github.com/FDiskas/saskaitos';

export function AppFooter() {
  const t = useTranslate();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-10 border-t border-slate-200 pt-4 text-xs text-slate-500">
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <p>{withParams(t['app.footer.copyright'], { year })}</p>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-slate-100 hover:text-slate-800"
          >
            <GithubMark />
            github.com/FDiskas/saskaitos
          </a>
        </div>
      </div>
    </footer>
  );
}

function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const t = useTranslate();
  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white p-0.5">
      <FlagButton
        code="lt"
        active={language === 'lt'}
        title={t['app.footer.language.lt']}
        onClick={() => setLanguage('lt')}
      />
      <FlagButton
        code="en"
        active={language === 'en'}
        title={t['app.footer.language.en']}
        onClick={() => setLanguage('en')}
      />
    </div>
  );
}

interface FlagButtonProps {
  code: LanguageCode;
  active: boolean;
  title: string;
  onClick: () => void;
}

function FlagButton({ code, active, title, onClick }: FlagButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`inline-flex h-6 items-center rounded px-1.5 text-xs font-semibold uppercase transition ${
        active
          ? 'bg-slate-900 text-white'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
      }`}
    >
      <Flag code={code} />
      <span className="ml-1">{code}</span>
    </button>
  );
}

function Flag({ code }: { code: LanguageCode }) {
  if (code === 'lt') return <LithuaniaFlag />;
  return <UnitedKingdomFlag />;
}

function LithuaniaFlag() {
  return (
    <svg viewBox="0 0 9 6" aria-hidden className="h-3 w-4 rounded-[1px] ring-1 ring-black/10">
      <rect width="9" height="2" y="0" fill="#FDB913" />
      <rect width="9" height="2" y="2" fill="#006A44" />
      <rect width="9" height="2" y="4" fill="#C1272D" />
    </svg>
  );
}

function UnitedKingdomFlag() {
  return (
    <svg viewBox="0 0 60 30" aria-hidden className="h-3 w-4 rounded-[1px] ring-1 ring-black/10">
      <clipPath id="lang-flag-uk-clip">
        <rect width="60" height="30" />
      </clipPath>
      <g clipPath="url(#lang-flag-uk-clip)">
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" clipPath="url(#lang-flag-uk-clip)" />
        <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

function GithubMark() {
  return (
    <svg
      role="img"
      aria-label="GitHub"
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5"
      fill="currentColor"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
