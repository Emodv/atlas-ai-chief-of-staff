begin;

drop trigger if exists atlas_require_alpha_invite_before_signup on auth.users;

comment on table atlas_alpha_invites is 'Legacy private-alpha invite registry. Signup no longer requires invite codes as of open alpha activation.';

commit;
