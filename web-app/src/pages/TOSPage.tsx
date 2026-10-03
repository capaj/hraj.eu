import { Trans } from '@lingui/react/macro'
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
            <Trans>Terms of Service</Trans>
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            <Trans>Please read these terms carefully before using hraj.eu. By using our
            platform, you agree to these terms.</Trans>
          </p>
          <p className="text-sm text-white/60 mt-2">
            <Trans>Last updated: December 2024</Trans>
          </p>
        </div>

        <div className="space-y-6">
          {/* Acceptance of Terms */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Gavel className="text-primary-600 mr-2" size={20} />
                <Trans>Acceptance of Terms</Trans>
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 mb-4">
                <Trans>By accessing and using hraj.eu ("the Platform"), you accept and
                agree to be bound by the terms and provision of this agreement.
                If you do not agree to abide by the above, please do not use
                this service.</Trans>
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  <Trans><strong>Important:</strong> These terms constitute a legally
                  binding agreement between you and hraj.eu. Please read them
                  carefully.</Trans>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Platform Description */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Users className="text-primary-600 mr-2" size={20} />
                <Trans>Platform Description</Trans>
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 mb-4">
                <Trans>hraj.eu is a community platform that connects amateur sports
                enthusiasts across Europe. Our services include:</Trans>
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>
                  <Trans>Event creation and management tools for sports activities</Trans>
                </li>
                <li>
                  <Trans>User profiles with skill level tracking and karma system</Trans>
                </li>
                <li><Trans>Venue database and location services</Trans></li>
                <li><Trans>Payment facilitation for event costs</Trans></li>
                <li><Trans>Community features including ratings and feedback</Trans></li>
                <li><Trans>Notification and communication systems</Trans></li>
              </ul>
            </CardContent>
          </Card>

          {/* User Accounts */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Shield className="text-primary-600 mr-2" size={20} />
                <Trans>User Accounts and Responsibilities</Trans>
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    <Trans>Account Creation</Trans>
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>
                      <Trans>You must be at least 16 years old to create an account</Trans>
                    </li>
                    <li><Trans>You must provide accurate and complete information</Trans></li>
                    <li>
                      <Trans>You are responsible for maintaining the security of your
                      account</Trans>
                    </li>
                    <li><Trans>One person may only maintain one account</Trans></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    <Trans>User Conduct</Trans>
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>
                      <Trans>Treat all community members with respect and courtesy</Trans>
                    </li>
                    <li>
                      <Trans>Provide honest feedback and accurate skill level
                      assessments</Trans>
                    </li>
                    <li>
                      <Trans>Honor your commitments to attend events you've joined</Trans>
                    </li>
                    <li>
                      <Trans>Report any safety concerns or inappropriate behavior</Trans>
                    </li>
                    <li><Trans>Comply with all applicable laws and regulations</Trans></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    <Trans>Prohibited Activities</Trans>
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li><Trans>Creating fake accounts or impersonating others</Trans></li>
                    <li><Trans>Harassment, discrimination, or abusive behavior</Trans></li>
                    <li><Trans>Spam, fraud, or misleading information</Trans></li>
                    <li><Trans>Commercial activities without prior authorization</Trans></li>
                    <li><Trans>Attempting to hack or disrupt the platform</Trans></li>
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
                <Trans>Events and Payments</Trans>
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    <Trans>Event Organization</Trans>
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>
                      <Trans>Event organizers are responsible for the safety and
                      conduct of their events</Trans>
                    </li>
                    <li>
                      <Trans>Organizers must provide accurate event information and
                      venue details</Trans>
                    </li>
                    <li>
                      <Trans>Cancellation policies must be clearly communicated to
                      participants</Trans>
                    </li>
                    <li>
                      <Trans>Organizers should have appropriate insurance coverage</Trans>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    <Trans>Event Participation</Trans>
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li><Trans>Participants join events at their own risk</Trans></li>
                    <li>
                      <Trans>You must honor your commitment to attend events you've
                      joined</Trans>
                    </li>
                    <li><Trans>Notify organizers promptly if you cannot attend</Trans></li>
                    <li><Trans>Follow all event rules and safety guidelines</Trans></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2"><Trans>Payments</Trans></h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>
                      <Trans>hraj.eu facilitates payments but is not responsible for
                      disputes</Trans>
                    </li>
                    <li><Trans>Refund policies are determined by event organizers</Trans></li>
                    <li><Trans>Payment information must be accurate and up-to-date</Trans></li>
                    <li><Trans>Users are responsible for any applicable taxes</Trans></li>
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
                <Trans>Karma System and Community Standards</Trans>
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <p className="text-gray-700">
                  <Trans>Our karma system is designed to promote good sportsmanship and
                  reliable participation:</Trans>
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>
                    <Trans>Karma points reflect your reputation within the community</Trans>
                  </li>
                  <li>
                    <Trans>Points are awarded for positive behavior and deducted for
                    negative actions</Trans>
                  </li>
                  <li><Trans>Feedback should be honest and constructive</Trans></li>
                  <li>
                    <Trans>False or malicious reports may result in account penalties</Trans>
                  </li>
                  <li>
                    <Trans>We reserve the right to adjust karma scores for system
                    integrity</Trans>
                  </li>
                </ul>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                  <p className="text-amber-800 text-sm">
                    <Trans><strong>Note:</strong> Consistently low karma scores may
                    result in restricted access to certain platform features.</Trans>
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
                <Trans>Liability and Disclaimers</Trans>
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    <Trans>Platform Liability</Trans>
                  </h3>
                  <p className="text-gray-700">
                    <Trans>hraj.eu provides a platform for connecting sports
                    enthusiasts but is not responsible for:</Trans>
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
                    <li>
                      <Trans>Injuries or accidents that occur during sports activities</Trans>
                    </li>
                    <li><Trans>Disputes between users or event-related conflicts</Trans></li>
                    <li><Trans>The accuracy of user-provided information</Trans></li>
                    <li><Trans>Venue conditions or third-party services</Trans></li>
                    <li><Trans>Weather conditions or event cancellations</Trans></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    <Trans>User Responsibility</Trans>
                  </h3>
                  <p className="text-gray-700">
                    <Trans>Users participate in sports activities at their own risk and
                    are responsible for:</Trans>
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
                    <li><Trans>Their own safety and well-being during events</Trans></li>
                    <li><Trans>Having appropriate insurance coverage</Trans></li>
                    <li><Trans>Assessing their own fitness level for activities</Trans></li>
                    <li><Trans>Following safety guidelines and venue rules</Trans></li>
                  </ul>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">
                    <Trans><strong>Important:</strong> Sports activities involve
                    inherent risks. Please ensure you have appropriate insurance
                    coverage and assess your fitness level before participating.</Trans>
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
                <Trans>Intellectual Property</Trans>
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <p className="text-gray-700">
                  <Trans>The hraj.eu platform, including its design, features, and
                  content, is protected by intellectual property laws:</Trans>
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>
                    <Trans>You may not copy, modify, or distribute our platform or
                    content</Trans>
                  </li>
                  <li>
                    <Trans>User-generated content remains owned by the user but grants
                    us usage rights</Trans>
                  </li>
                  <li>
                    <Trans>You must respect the intellectual property rights of other
                    users</Trans>
                  </li>
                  <li>
                    <Trans>Report any copyright infringement to our designated agent</Trans>
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
                <Trans>Account Termination</Trans>
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <p className="text-gray-700 mb-3">
                  <Trans>We reserve the right to suspend or terminate accounts for
                  violations of these terms:</Trans>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      <Trans>Grounds for Termination</Trans>
                    </h4>
                    <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                      <li><Trans>Violation of community guidelines</Trans></li>
                      <li><Trans>Fraudulent or illegal activity</Trans></li>
                      <li><Trans>Repeated no-shows or bad behavior</Trans></li>
                      <li><Trans>Harassment of other users</Trans></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      <Trans>Your Rights</Trans>
                    </h4>
                    <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                      <li><Trans>You may delete your account at any time</Trans></li>
                      <li><Trans>You can appeal termination decisions</Trans></li>
                      <li><Trans>Data export available before deletion</Trans></li>
                      <li><Trans>Refunds handled case-by-case</Trans></li>
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
                <Trans>Governing Law and Disputes</Trans>
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <p className="text-gray-700">
                  <Trans>These terms are governed by the laws of the Czech Republic.
                  Any disputes will be resolved through:</Trans>
                </p>
                <ol className="list-decimal list-inside text-gray-700 space-y-1">
                  <li><Trans>Good faith negotiation between the parties</Trans></li>
                  <li><Trans>Mediation through a mutually agreed mediator</Trans></li>
                  <li>
                    <Trans>Arbitration or court proceedings in Prague, Czech Republic</Trans>
                  </li>
                </ol>
                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <p className="text-gray-700 text-sm">
                    <Trans><strong>EU Users:</strong> Nothing in these terms affects
                    your statutory rights as a consumer under applicable EU law.</Trans>
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
                <Trans>Contact Information</Trans>
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <p className="text-gray-700">
                  <Trans>If you have questions about these Terms of Service, please
                  contact us:</Trans>
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      <Trans><strong>Email:</strong> info@hraj.eu</Trans>
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
                <Trans>Changes to Terms</Trans>
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700">
                <Trans>We may update these Terms of Service from time to time. When we
                make significant changes, we will notify users by email or
                through a prominent notice on our platform. Continued use of
                hraj.eu after such modifications constitutes acceptance of the
                updated terms.</Trans>
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-blue-800 text-sm">
                  <Trans><strong>Tip:</strong> We recommend reviewing these terms
                  periodically to stay informed of any updates.</Trans>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
