import React from 'react'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import {
  FileText,
  Users,
  Shield,
  AlertTriangle,
  Gavel,
  Mail
} from 'lucide-react'

export const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4 flex items-center justify-center">
            <FileText className="text-white mr-3" size={32} />
            Terms of Service
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Please read these terms carefully before using hraj.eu. By using our
            platform, you agree to these terms.
          </p>
          <p className="text-sm text-white/60 mt-2">
            Last updated: December 2024
          </p>
        </div>

        <div className="space-y-6">
          {/* Acceptance of Terms */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Gavel className="text-primary-600 mr-2" size={20} />
                Acceptance of Terms
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 mb-4">
                By accessing and using hraj.eu ("the Platform"), you accept and
                agree to be bound by the terms and provision of this agreement.
                If you do not agree to abide by the above, please do not use
                this service.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  <strong>Important:</strong> These terms constitute a legally
                  binding agreement between you and hraj.eu. Please read them
                  carefully.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Platform Description */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Users className="text-primary-600 mr-2" size={20} />
                Platform Description
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 mb-4">
                hraj.eu is a community platform that connects amateur sports
                enthusiasts across Europe. Our services include:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>
                  Event creation and management tools for sports activities
                </li>
                <li>
                  User profiles with skill level tracking and karma system
                </li>
                <li>Venue database and location services</li>
                <li>Payment facilitation for event costs</li>
                <li>Community features including ratings and feedback</li>
                <li>Notification and communication systems</li>
              </ul>
            </CardContent>
          </Card>

          {/* User Accounts */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Shield className="text-primary-600 mr-2" size={20} />
                User Accounts and Responsibilities
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Account Creation
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>
                      You must be at least 16 years old to create an account
                    </li>
                    <li>You must provide accurate and complete information</li>
                    <li>
                      You are responsible for maintaining the security of your
                      account
                    </li>
                    <li>One person may only maintain one account</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    User Conduct
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>
                      Treat all community members with respect and courtesy
                    </li>
                    <li>
                      Provide honest feedback and accurate skill level
                      assessments
                    </li>
                    <li>
                      Honor your commitments to attend events you've joined
                    </li>
                    <li>
                      Report any safety concerns or inappropriate behavior
                    </li>
                    <li>Comply with all applicable laws and regulations</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Prohibited Activities
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Creating fake accounts or impersonating others</li>
                    <li>Harassment, discrimination, or abusive behavior</li>
                    <li>Spam, fraud, or misleading information</li>
                    <li>Commercial activities without prior authorization</li>
                    <li>Attempting to hack or disrupt the platform</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Events and Payments */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Users className="text-primary-600 mr-2" size={20} />
                Events and Payments
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Event Organization
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>
                      Event organizers are responsible for the safety and
                      conduct of their events
                    </li>
                    <li>
                      Organizers must provide accurate event information and
                      venue details
                    </li>
                    <li>
                      Cancellation policies must be clearly communicated to
                      participants
                    </li>
                    <li>
                      Organizers should have appropriate insurance coverage
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Event Participation
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Participants join events at their own risk</li>
                    <li>
                      You must honor your commitment to attend events you've
                      joined
                    </li>
                    <li>Notify organizers promptly if you cannot attend</li>
                    <li>Follow all event rules and safety guidelines</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Payments</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>
                      hraj.eu facilitates payments but is not responsible for
                      disputes
                    </li>
                    <li>Refund policies are determined by event organizers</li>
                    <li>Payment information must be accurate and up-to-date</li>
                    <li>Users are responsible for any applicable taxes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Karma System */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Shield className="text-primary-600 mr-2" size={20} />
                Karma System and Community Standards
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <p className="text-gray-700">
                  Our karma system is designed to promote good sportsmanship and
                  reliable participation:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>
                    Karma points reflect your reputation within the community
                  </li>
                  <li>
                    Points are awarded for positive behavior and deducted for
                    negative actions
                  </li>
                  <li>Feedback should be honest and constructive</li>
                  <li>
                    False or malicious reports may result in account penalties
                  </li>
                  <li>
                    We reserve the right to adjust karma scores for system
                    integrity
                  </li>
                </ul>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                  <p className="text-amber-800 text-sm">
                    <strong>Note:</strong> Consistently low karma scores may
                    result in restricted access to certain platform features.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liability and Disclaimers */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <AlertTriangle className="text-primary-600 mr-2" size={20} />
                Liability and Disclaimers
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Platform Liability
                  </h3>
                  <p className="text-gray-700">
                    hraj.eu provides a platform for connecting sports
                    enthusiasts but is not responsible for:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
                    <li>
                      Injuries or accidents that occur during sports activities
                    </li>
                    <li>Disputes between users or event-related conflicts</li>
                    <li>The accuracy of user-provided information</li>
                    <li>Venue conditions or third-party services</li>
                    <li>Weather conditions or event cancellations</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    User Responsibility
                  </h3>
                  <p className="text-gray-700">
                    Users participate in sports activities at their own risk and
                    are responsible for:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
                    <li>Their own safety and well-being during events</li>
                    <li>Having appropriate insurance coverage</li>
                    <li>Assessing their own fitness level for activities</li>
                    <li>Following safety guidelines and venue rules</li>
                  </ul>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">
                    <strong>Important:</strong> Sports activities involve
                    inherent risks. Please ensure you have appropriate insurance
                    coverage and assess your fitness level before participating.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Intellectual Property */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <FileText className="text-primary-600 mr-2" size={20} />
                Intellectual Property
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <p className="text-gray-700">
                  The hraj.eu platform, including its design, features, and
                  content, is protected by intellectual property laws:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>
                    You may not copy, modify, or distribute our platform or
                    content
                  </li>
                  <li>
                    User-generated content remains owned by the user but grants
                    us usage rights
                  </li>
                  <li>
                    You must respect the intellectual property rights of other
                    users
                  </li>
                  <li>
                    Report any copyright infringement to our designated agent
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <AlertTriangle className="text-primary-600 mr-2" size={20} />
                Account Termination
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <p className="text-gray-700 mb-3">
                  We reserve the right to suspend or terminate accounts for
                  violations of these terms:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Grounds for Termination
                    </h4>
                    <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                      <li>Violation of community guidelines</li>
                      <li>Fraudulent or illegal activity</li>
                      <li>Repeated no-shows or bad behavior</li>
                      <li>Harassment of other users</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Your Rights
                    </h4>
                    <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                      <li>You may delete your account at any time</li>
                      <li>You can appeal termination decisions</li>
                      <li>Data export available before deletion</li>
                      <li>Refunds handled case-by-case</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Governing Law */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Gavel className="text-primary-600 mr-2" size={20} />
                Governing Law and Disputes
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <p className="text-gray-700">
                  These terms are governed by the laws of the Czech Republic.
                  Any disputes will be resolved through:
                </p>
                <ol className="list-decimal list-inside text-gray-700 space-y-1">
                  <li>Good faith negotiation between the parties</li>
                  <li>Mediation through a mutually agreed mediator</li>
                  <li>
                    Arbitration or court proceedings in Prague, Czech Republic
                  </li>
                </ol>
                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <p className="text-gray-700 text-sm">
                    <strong>EU Users:</strong> Nothing in these terms affects
                    your statutory rights as a consumer under applicable EU law.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Mail className="text-primary-600 mr-2" size={20} />
                Contact Information
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <p className="text-gray-700">
                  If you have questions about these Terms of Service, please
                  contact us:
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      <strong>Email:</strong> info@hraj.eu
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <FileText className="text-primary-600 mr-2" size={20} />
                Changes to Terms
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700">
                We may update these Terms of Service from time to time. When we
                make significant changes, we will notify users by email or
                through a prominent notice on our platform. Continued use of
                hraj.eu after such modifications constitutes acceptance of the
                updated terms.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-blue-800 text-sm">
                  <strong>Tip:</strong> We recommend reviewing these terms
                  periodically to stay informed of any updates.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
