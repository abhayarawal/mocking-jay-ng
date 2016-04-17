export enum UserType {
	Student,
	Faculty
}

export interface User {
	id: string,
	fname: string,
	lname: string,
	email: string,
	meta?: {},
	type: UserType
}

export interface Faculty {
	_id: string,
	_user: string,
	_faculty: string
}

export interface Date {
	year: number,
	month: number,
	day: number
}

export interface Time {
	hour: number,
	minute: number
}


export interface Template {
	id: string,
	_id?: string,
	name: string,
	interval: any,
	allow_multiple: boolean,
	require_accept: boolean,
	_user: string,
	user?: {} 
}

export interface Segment {
	id: string,
	_template: string,
	template?: Template,
	date: Date,
	start: Time,
	end: Time,
	repeat: boolean,
	_user: string,
	repeat_until?: Date,
	repeat_days?: [number],
	instance_of?: string,
	location?: string
}


// default,
// in_progress,
// approved,
// denied,
// cancelled,
// unavailable,
// blocked

export enum Status {
	default,
	in_progress,
	approved,
	denied,
	cancelled,
	unavailable,
	blocked
}

export interface Message {
	body: string,
	date?: Date,
	type?: UserType 
}

export interface Fragment {
	id: string,
	date: Date,
	start: Time,
	end: Time,
	_segment: string,
	_user?: string,
	segment?: Segment,
	message?: string,
	messages?: Message[],
	status?: Status,
	// responses?: Message[],
	instance_id?: string,
	history?: Fragment[],
	persistent?: boolean
}






// end