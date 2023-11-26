# frozen_string_literal: true

discomatcher_user_id = MagicMatching::MATCHER_USER_ID
discomatcher_username = MagicMatching::MATCHER_USERNAME

def seed_primary_email
  UserEmail.seed do |ue|
    ue.id = discomatcher_user_id
    ue.email = "#{discomatcher_username}_email"
    ue.primary = true
    ue.user_id = discomatcher_user_id
  end
end

User.skip_callback(:save, :after, :refresh_avatar)

	unless user = User.find_by(id: discomatcher_user_id)
		suggested_username = UserNameSuggester.suggest(discomatcher_username)
	
		seed_primary_email
	
		User.seed do |u|
			u.id = discomatcher_user_id
			u.name = discomatcher_username
			u.username = suggested_username
			u.username_lower = suggested_username.downcase
			u.password = SecureRandom.hex
			u.active = true
			u.approved = true
			u.trust_level = TrustLevel[4]
		end
	end

	matcher = User.find(discomatcher_user_id)
	
	# ensure discomatcher has a primary email
	unless matcher.primary_email
		seed_primary_email
		matcher.reload
	end
	
	matcher.update!(admin: true, moderator: false)
	
	matcher.create_user_option! if !matcher.user_option
	
	matcher.user_option.update!(
		email_messages_level: UserOption.email_level_types[:never],
		email_level: UserOption.email_level_types[:never],
	)
	
	matcher.create_user_profile! if !matcher.user_profile
	
	if !matcher.user_profile.bio_raw
	  matcher.user_profile.update!(bio_raw: I18n.t("magic-matching.bio"))
	end
	
	Group.user_trust_level_change!(discomatcher_user_id, TrustLevel[4])

User.set_callback(:save, :after, :refresh_avatar)

## we don't really need to refresh the avatar, but if we did...
# Thread.new do
#   sleep(30)  # Wait for 30 seconds
#   matcher.refresh_avatar
# end
