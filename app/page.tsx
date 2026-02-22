import FeedbackBoard from './components/FeedbackBoard'

export default function HomePage() {
  return (
    <div className="fixed inset-0 top-14 sm:top-16 flex flex-col">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col min-h-0">
        <FeedbackBoard />
      </div>
    </div>
  )
}
