export interface Env {
	TURSO_DATABASE_URL: string
	TURSO_AUTH_TOKEN: string
	RESEND_API_KEY: string
	SENDER_EMAIL: string
	APP_BASE_URL?: string
}

export interface EventRow {
	id: string
	title: string
	description: string | null
	sport: string
	date: string
	startTime: string
	duration: number
	minParticipants: number
	idealParticipants: number | null
	maxParticipants: number
	price: number | null
	currency: string | null
	paymentDetails: string | null
	gameRules: string | null
	venueName: string | null
	venueAddress: string | null
}

export interface ParticipantRow {
	email: string
	name: string | null
}
