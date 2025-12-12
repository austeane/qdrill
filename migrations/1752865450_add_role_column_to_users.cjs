export const shorthands = undefined;

export const up = (pgm) => {
	pgm.addColumn('users', {
		role: { type: 'varchar(20)', notNull: true, default: 'user' }
	});
};

export const down = (pgm) => {
	pgm.dropColumn('users', 'role');
};
