export function load({ locals }) {
	return {
		user: locals.user
			? { id: locals.user.id, display_name: locals.user.display_name, avatar: locals.user.avatar }
			: null,
		member: locals.member
			? { id: locals.member.id, display_name: locals.member.display_name, avatar: locals.member.avatar }
			: null,
		space: locals.space ? { id: locals.space.id, name: locals.space.name } : null
	};
}
