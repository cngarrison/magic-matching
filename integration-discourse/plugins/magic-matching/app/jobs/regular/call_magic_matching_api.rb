# # include MagicMatching::Utils
# require_relative '../../../lib/magic_matching/utils'

module Jobs
  class CallMagicMatchingApi < ::Jobs::Base

    def execute(args)
			Rails.logger.info('-----------------------------------------------------')
			Rails.logger.info("JOB-CallMagicMatchingApi - user: #{args[:user_id]}")
			Rails.logger.info("JOB-CallMagicMatchingApi action: #{args[:action]}")
			Rails.logger.info('-----------------------------------------------------')
      raise Discourse::InvalidParameters.new(:user_id) if args[:user_id].blank?
      raise Discourse::InvalidParameters.new(:action) if args[:action].blank?

      #return unless user = User.find_by(id: args[:user_id])
      user_id = args[:user_id]
      user = User.find_by(id: user_id)
      raise Discourse::InvalidParameters.new(:user_id) unless user

			action = args[:action].to_sym

			case action
			when :post_created
				post_id = args[:post_id]
				post = Post.find_by(id: post_id)
				raise Discourse::InvalidParameters.new(:post_id) unless post
				handle_post_created(user, post, args)
			when :user_created
				handle_user_created(user, args)
			when :user_updated
				handle_user_updated(user, args)
			else
				# Handle unknown action type
				raise Discourse::InvalidParameters.new(:action)
			end

    end


		def handle_post_created(user, post, args)
      api_client = MagicMatching::ApiClient.new(auth_user: user)
      api_client.update_user_profile(user: user, post: post, args: args)
		end
		
		def handle_user_created(user, args)
      api_client = MagicMatching::ApiClient.new()
      api_client.create_user(user: user, args: args)
		end

		def handle_user_updated(user, args)
      api_client = MagicMatching::ApiClient.new()
      api_client.create_user(user: user, args: args, update: true)
		end


  end
end
