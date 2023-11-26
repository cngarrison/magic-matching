# frozen_string_literal: true

# name: magic-matching
# about: A plugin to interact with magic-matching API
# version: 0.0.1
# authors: CNG
# url: https://github.com/cngarrison/discourse-plugin-magic-matching



# route: /admin/plugins/magic-matching
# add_admin_route 'magic-matching.admin.title', 'magic-matching'

module ::MagicMatching
	PLUGIN_NAME = "magic-matching".freeze
	MATCHER_USER_ID = -8
	MATCHER_USERNAME = "discomatcher".freeze

end

# DiscoursePluginRegistry.serialized_current_user_fields << "seen_plugin_init"
# register_asset 'stylesheets/common/magic-matching.scss'

require_relative 'lib/magic_matching/utils'

after_initialize do

  %w[
    ../lib/magic_matching/engine.rb
    ../lib/magic_matching/api_client.rb
    ../lib/magic_matching/event_handlers.rb
    ../app/jobs/regular/call_magic_matching_api.rb
  ].each do |path|
    load File.expand_path(path, __FILE__)
  end

  require_relative "app/controllers/magic_matching_controller.rb"

  Rails.logger.info('-----------------------------------------------------')
  Rails.logger.info('MagicMatching is getting ready...')


  SeedFu.seed(Rails.root.join('plugins', 'magic-matching', 'db', 'fixtures'))
  Rails.logger.info('== Seed fixtures have been loaded')

  require_relative "lib/magic_matching/setup"
	MagicMatching::Setup.setup_plugin()


  # Register webhook endpoint within engine
  MagicMatching::Engine.routes.draw do
    post "/webhook" => "magic_matching#webhook"
  end

  # mount engine as a partial route
  Discourse::Application.routes.append do
    mount ::MagicMatching::Engine, at: "/magic-matching"
# 		post '/admin/plugins/magic-matching/init' => 'magic_matching/admin#init'
# 		get '/admin/plugins/magic-matching' => 'magic_matching/admin/plugins#index', constraints: StaffConstraint.new
  end



  UserAvatar.register_custom_user_gravatar_email_hash(
    MagicMatching::MATCHER_USER_ID,
    "discomatcher@magicmatching.org",
  )


	Rails.logger.info('MagicMatching is ready, say "Match Me!" on Discourse!')
	Rails.logger.info('-----------------------------------------------------')

end


