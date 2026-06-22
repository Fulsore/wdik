import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-mist">
      <nav className="max-w-2xl mx-auto px-6 py-5">
        <Link href="/" className="font-semibold text-ink tracking-tight">where</Link>
      </nav>
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-semibold text-ink mb-2">Privacy policy</h1>
        <p className="text-slate text-sm mb-10">Plain English. No legalese.</p>

        <div className="card p-8 space-y-8">
          {[
            {
              title: 'What we store',
              body: 'Your name, email address, the entries you create (brain dumps), and when they were created. Nothing else.',
            },
            {
              title: 'What we do not do',
              body: 'We do not sell your data. We do not share it with advertisers. We do not run analytics on the content of your entries.',
            },
            {
              title: 'Emails we send',
              body: 'We send reminder emails (the reason you signed up) and one launch email when early access opens. You can unsubscribe from either at any time.',
            },
            {
              title: 'Data deletion',
              body: 'Email hello@where.app and we will delete your account and all your data within 48 hours.',
            },
            {
              title: 'Security',
              body: 'Your data is stored on a private database. We use HTTPS everywhere. We do not store passwords.',
            },
            {
              title: 'Contact',
              body: 'Questions? hello@where.app — a real person reads every email.',
            },
          ].map((section) => (
            <div key={section.title}>
              <h2 className="text-base font-semibold text-ink mb-2">{section.title}</h2>
              <p className="text-slate text-sm leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-slate hover:text-ink transition-colors underline">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}