# frozen_string_literal: true

module ::MagicMatching

  class Engine < ::Rails::Engine
    engine_name MagicMatching::PLUGIN_NAME
    isolate_namespace MagicMatching
#     config.autoload_paths << File.join(config.root, "lib")

  end

	#enabled_site_setting :magicmatching_enabled
	def self.enabled?
		SiteSetting.magicmatching_enabled
	end

  def self.post_watch_categories
    SiteSetting.magicmatching_post_watch_categories.split('|').map(&:to_i) # Convert to integers
  end

  def self.admin_channel_id
    SiteSetting.magicmatching_admin_channel_id
  end

  def self.webhook_url
		webhook_url = if SiteSetting.magicmatching_webhook_url.present?
			SiteSetting.magicmatching_webhook_url
		else
			"#{Discourse.base_url}/magic-matching/webhook.json"
		end
		webhook_url
  end


end


