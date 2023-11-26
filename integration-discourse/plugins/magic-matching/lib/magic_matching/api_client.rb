# frozen_string_literal: true

require 'json'
require 'securerandom'
require 'base64'

require_relative 'api_base'
require_relative 'utils'

module ::MagicMatching
  class ApiClient

		def initialize(headers: {}, auth_user: nil)
			@headers = headers
			@auth_user = auth_user
			@base_api = MagicMatching::ApiBase.new(headers: @headers, auth_user: @auth_user)
		end	

		def setup_plugin( )
			## if setup_plugin is called, then we want to complete the process regardless of 
			## whether admin_auth_session is already set - the old session will be invalidated anyway
# 			auth_session = MagicMatching::Utils.get_plugindata('admin_auth_session')
#       if auth_session.nil? || auth_session['access_token'].nil?
		
				rand_pass = SecureRandom.base64(12).tr('+/=lIO0', 'pqrsxyz')
				org_data = {
					name: SiteSetting.title,
					email: SiteSetting.contact_email,
					password: rand_pass,
					description: SiteSetting.site_description,
					site_url: Discourse.base_url,
					webhook_url: MagicMatching.webhook_url,
					# logo_url: SiteSetting.logo_url,
					# favicon_url: SiteSetting.favicon_url
				}
				
				new_org = @base_api.post('/functions/v1/org-create', { organisation: org_data } )

				if new_org && !new_org&.dig('error')
					MagicMatching::Utils.save_plugindata('admin_auth_session', new_org['session']) if new_org&.dig('session')
					MagicMatching::Utils.save_plugindata('organisation', new_org['organisation']) if new_org&.dig('organisation')
					MagicMatching::Utils.save_plugindata('user', new_org['user']) if new_org&.dig('user')

					return new_org
				else 
					Rails.logger.error("Error creating organisation: #{SiteSetting.title} - #{new_org&.dig('error')}")
					return false
			end

# 			end
		end

		def create_user(user: , args: nil, update: false )
      userdata = MagicMatching::Utils.get_userdata(user)
      if update || userdata.nil? || userdata['userid'].nil? || userdata['auth_session'].nil?

				if update && !userdata.nil? && !userdata['password'].nil? 
					password = userdata['password']
				else
					password = SecureRandom.base64(12).tr('+/=lIO0', 'pqrsxyz')
				end
				user_data = {
					email: user.email, 
					password: password
				}

				new_user = @base_api.post('/functions/v1/users', {user: user_data	})
				# Rails.logger.info("new_user: #{new_user}")
	
				if new_user && !new_user&.dig('error')
					userdata = { 
						user: new_user.dig('user'),
						auth_session: new_user.dig('session'),
					}
					MagicMatching::Utils.save_userdata(user, userdata)

					return new_user

				else
					Rails.logger.error("Error creating user: #{user.email} - #{new_user&.dig('error')}")
					return false
				end
			else 
				Rails.logger.error("Userdata already exists: #{user.email}")
				return false
      end
      
    end


		def update_user_profile(user:, post:, args: nil )
			Rails.logger.info('API-update_user_profile post:')
			Rails.logger.info(post)
			Rails.logger.info(post.cooked)


			posted_topic_id = post.topic.id
# 			posted_category_id = post.topic.category.id
# 			posted_category_name = Category.find_by(id: posted_category_id).name

				profile_data = {
					email: user.email, 
					content: post.raw,
					topic_id: posted_topic_id, 
# 					type: post.type
				}


				profile_update = @base_api.post('/functions/v1/persons/update_profile', {profile: profile_data	})
				Rails.logger.info("profile_update: ")
				Rails.logger.info(profile_update)

# 			@base_api.post('/add-person', {person: {
# 											username: post.user.username,
# 											meta: { post: post, user: post.user },
# 											location: '',
# 											sections: [
# 												{
# 													slug: '',
# 													heading: '',
# 													content: message,
# 												},
# 											],
# 										} })
		end


		def create_post(post: , args: nil, update: false )
			user = User.find_by_id(post.user_id)
      userdata = MagicMatching::Utils.get_userdata(user)

			post_data = {
			
			}
	
			new_user = @base_api.post('/functions/v1/persons/messages', {user: post_data	})
			# Rails.logger.info("new_user: #{new_user}")

			if new_user && !new_user&.dig('error')
				userdata = { 
					user: new_user.dig('user'),
					auth_session: new_user.dig('session'),
				}
				MagicMatching::Utils.save_userdata(user, userdata)

				return new_user

			else
				Rails.logger.error("Error creating user: #{user.email} - #{new_user&.dig('error')}")
				return false
			end
      
    end

  end
end
