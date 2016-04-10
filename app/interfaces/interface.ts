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
	name: string,
	interval: any,
	allow_multiple: boolean,
	require_accept: boolean,
	user_id: string,
	user?: {} 
}

export interface Segment {
	id: string,
	template_id: string,
	template?: Template,
	date: Date,
	start: Time,
	end: Time,
	repeat: boolean,
	user_id: string,
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


export interface Fragment {
	id: string,
	date: Date,
	start: Time,
	end: Time,
	segment_id: string,
	user_id?: string,
	segment?: Segment,
	message?: string,
	status?: Status,
	response?: string[],
	instance_id?: string
}






// end