export enum UserType {
	Student,
	Faculty
}

export interface User {
	id: string,
	fname?: string,
	lname?: string,
	avatar?: string,
	type: UserType
}