import { I18nProvider, useLingui } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { Link, useHydrated } from '@tanstack/react-router'
import { ArrowDown, ArrowUpRight, Check, Copy, Download } from 'lucide-react'
import { toast } from 'sonner'
import { messages as csMessages } from '../../app/locales/cs.mjs'
import './PresskitPage.css'

const serverI18n = setupI18n({ locale: 'cs', messages: { cs: csMessages } })

const brandColors = [
  { name: msg`Court green`, hex: '#16A34A', light: false },
  { name: msg`Forest`, hex: '#14532D', light: true },
  { name: msg`Play lime`, hex: '#BEF264', light: false },
  { name: msg`Chalk`, hex: '#F6F8F2', light: false }
]

const brandAssets = [
  {
    name: msg`Primary logo`,
    description: msg`Our everyday logo. Best on light backgrounds.`,
    file: 'hraj-logo',
    className: 'presskit-asset--light',
    width: 296,
    height: 80
  },
  {
    name: msg`Reversed logo`,
    description: msg`The light version. Give it a dark background.`,
    file: 'hraj-logo-white',
    className: 'presskit-asset--dark',
    width: 296,
    height: 80
  },
  {
    name: msg`Brand mark`,
    description: msg`Small space? Use the mark for icons and avatars.`,
    file: 'hraj-mark',
    className: 'presskit-asset--lime',
    width: 64,
    height: 64
  }
]

export function PresskitPage() {
  const { i18n } = useLingui()
  const hydrated = useHydrated()

  // The shared provider can restore English before a lazy route hydrates.
  // Match the server's Czech text first, then follow the selected language.
  return (
    <I18nProvider i18n={hydrated ? i18n : serverI18n}>
      <PresskitContent />
    </I18nProvider>
  )
}

function PresskitContent() {
  const { i18n } = useLingui()
  const description = i18n._(msg`hraj.eu helps amateur players find people to play team sports with. Discover local games, join a team, or organize your own event. Less planning, more playing — and new friends along the way.`)

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(i18n._(msg`Copied to clipboard`))
    } catch {
      toast.error(i18n._(msg`Could not copy. Please select and copy the text.`))
    }
  }

  return (
    <main className="presskit-page">
      <div className="presskit-container">
        <div className="presskit-heading">
          <div>
            <p className="presskit-eyebrow"><span aria-hidden="true" /> <Trans>Media & brand resources</Trans></p>
            <h1><Trans>Presskit</Trans><span className="presskit-heading-dot">.</span></h1>
            <p className="presskit-intro"><Trans>A shared love of sport. A look to match.</Trans></p>
          </div>
          <a href="/brand/hraj-presskit.zip" download="hraj-presskit.zip" className="presskit-button presskit-button--primary">
            <Download size={18} aria-hidden="true" />
            <Trans>Download presskit</Trans>
            <span className="presskit-file-type">ZIP</span>
          </a>
        </div>

        <section className="presskit-hero" aria-labelledby="presskit-story-title">
          <div className="presskit-story">
            <p className="presskit-eyebrow"><Trans>Everyone has a place on the team</Trans></p>
            <h2 id="presskit-story-title"><Trans>Less planning.<br />More playing.</Trans></h2>
            <p><Trans>Good games start with good company. We bring people together through amateur team sports, one local game at a time.</Trans></p>
            <a href="#logos" className="presskit-text-link"><Trans>Meet our new look</Trans><ArrowDown size={17} aria-hidden="true" /></a>
          </div>
          <div className="presskit-court">
            <div className="presskit-court-lines" aria-hidden="true"><span /><span /><span /></div>
            <p className="presskit-court-label"><span aria-hidden="true" /> <Trans>Made to play together</Trans></p>
            <img src="/brand/hraj-logo-white.svg" alt="hraj.eu" width="296" height="80" className="presskit-hero-logo" />
            <p className="presskit-court-caption"><Trans>Your next game starts here.</Trans><ArrowUpRight size={20} aria-hidden="true" /></p>
          </div>
        </section>

        <section id="logos" className="presskit-section" aria-labelledby="presskit-logos-title">
          <div className="presskit-section-heading">
            <h2 id="presskit-logos-title"><span className="presskit-section-number" aria-hidden="true">01</span><Trans>The logo</Trans></h2>
            <p><Trans>A soccer ball. A play button. An invitation to join in.</Trans></p>
          </div>
          <div className="presskit-assets">
            {brandAssets.map((asset) => {
              const name = i18n._(asset.name)
              return (
                <article key={asset.file} className="presskit-asset">
                  <div className={`presskit-asset-preview ${asset.className}`}>
                    <img src={`/brand/${asset.file}.svg`} alt={name} width={asset.width} height={asset.height} />
                  </div>
                  <div className="presskit-asset-details">
                    <h3>{name}</h3>
                    <p>{i18n._(asset.description)}</p>
                    <div className="presskit-downloads">
                      {['SVG', 'PNG'].map((format) => (
                        <a key={format} href={`/brand/${asset.file}.${format.toLowerCase()}`} download aria-label={i18n._(msg`Download ${name} as ${format}`)}>
                          <Download size={14} aria-hidden="true" />{format}
                        </a>
                      ))}
                      <span><Trans>Transparent background</Trans></span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
          <p className="presskit-note"><Check size={16} aria-hidden="true" /><Trans>Ready for web and print. SVGs stay sharp at any size; PNGs are exported at high resolution.</Trans></p>
        </section>

        <section className="presskit-section" aria-labelledby="presskit-colors-title">
          <div className="presskit-section-heading">
            <h2 id="presskit-colors-title"><span className="presskit-section-number" aria-hidden="true">02</span><Trans>Our colors</Trans></h2>
            <p><Trans>Fresh air, green courts, and a spark of energy.</Trans></p>
          </div>
          <div className="presskit-colors">
            {brandColors.map((color) => (
              <button key={color.hex} type="button" onClick={() => void copyText(color.hex)} className={`presskit-swatch ${color.light ? 'presskit-swatch--light-text' : ''}`} style={{ backgroundColor: color.hex }} aria-label={i18n._(msg`Copy color ${color.hex}`)}>
                <span className="presskit-swatch-name">{i18n._(color.name)}</span>
                <span className="presskit-swatch-code">{color.hex}<Copy size={16} aria-hidden="true" /></span>
              </button>
            ))}
          </div>
          <p className="presskit-note"><Copy size={14} aria-hidden="true" /><Trans>Click a swatch to copy its hex code.</Trans></p>
        </section>

        <div className="presskit-bottom-grid">
          <section className="presskit-section" aria-labelledby="presskit-about-title">
            <div className="presskit-section-heading">
              <h2 id="presskit-about-title"><span className="presskit-section-number" aria-hidden="true">03</span><Trans>In a few words</Trans></h2>
            </div>
            <div className="presskit-description">
              <span className="presskit-description-label"><Trans>About hraj.eu</Trans></span>
              <p>{description}</p>
              <button type="button" className="presskit-text-link" onClick={() => void copyText(description)}><Copy size={16} aria-hidden="true" /><Trans>Copy description</Trans></button>
            </div>
          </section>
          <section className="presskit-section" aria-labelledby="presskit-guidelines-title">
            <div className="presskit-section-heading">
              <h2 id="presskit-guidelines-title"><span className="presskit-section-number" aria-hidden="true">04</span><Trans>Give it room to play</Trans></h2>
            </div>
            <ul className="presskit-guidelines">
              <li><Check size={17} aria-hidden="true" /><Trans>Leave clear space around the logo, at least half the height of the mark.</Trans></li>
              <li><Check size={17} aria-hidden="true" /><Trans>Use the supplied colors and proportions. Do not add extra effects.</Trans></li>
              <li><Check size={17} aria-hidden="true" /><Trans>Choose a background with good contrast. Use the mark below 120 px wide.</Trans></li>
              <li><Check size={17} aria-hidden="true" /><Trans>Write our name as hraj.eu, in lowercase. Link to https://hraj.eu when you can.</Trans></li>
            </ul>
          </section>
        </div>

        <footer className="presskit-footer">
          <img src="/brand/hraj-logo.svg" alt="hraj.eu" width="296" height="80" />
          <p><Trans>See you on the court.</Trans></p>
          <Link to="/about" className="presskit-text-link"><Trans>More about hraj.eu</Trans><ArrowUpRight size={16} aria-hidden="true" /></Link>
        </footer>
      </div>
    </main>
  )
}
