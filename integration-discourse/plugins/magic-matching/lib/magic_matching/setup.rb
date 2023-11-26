# frozen_string_literal: true

module ::MagicMatching

  module Setup

		def self.setup_plugin( )
	
			is_initialized = MagicMatching::Utils.get_plugindata('is_initialized')
			Rails.logger.info("== plugin has #{is_initialized ? 'been initialized already' : 'not been initialized'}")
			if !is_initialized

				new_setup = self.add_organisation( )
				if new_setup		
					self.add_users( )
				else 
					Rails.logger.error("== -- Failed to create org")
				end
	
				MagicMatching::Utils.save_plugindata('is_initialized', true)
				Rails.logger.info('== initialization is done')
			end
		end

		def self.add_organisation( )
	
			api_client = MagicMatching::ApiClient.new()
			new_setup = api_client.setup_plugin()

			if new_setup
				new_org = new_setup.dig('organisation')
				Rails.logger.info("== -- Successfully created org: #{new_org['name']}")
				Rails.logger.info("== -- Session: #{new_setup.dig('session')}")
				else 
				Rails.logger.error("== -- Failed to create org")
			end

			return new_setup

		end
	
	
		def self.add_users( )
	
			## some different ways to find "active" users
			# active_users = User.where(active: true)
			# recently_logged_in_users = User.where("last_seen_at > ?", 30.days.ago)
			# active_posters = User.joins(:user_stat).where("user_stats.post_count > ?", 10)
			# not_suspended_users = User.where("suspended_till IS NULL OR suspended_till < ?", Time.zone.now)
			# active_users = User.where("active = ? AND last_seen_at > ? AND suspended_till IS NULL", true, 30.days.ago)

			## active flag && not system users && not suspended
			active_users = User.where("active = ? AND id > 0 AND suspended_till IS NULL", true)
		
			api_client = MagicMatching::ApiClient.new()

			active_users.each do |user|
				begin
					new_user = api_client.create_user(user: user, args: {})
					if new_user
						Rails.logger.info("== -- Successfully processed user: #{user.username}")
						Rails.logger.info("== -- Session: #{new_user.dig('session')}")
					else 
						Rails.logger.error("== -- Failed to create user: #{user.username}")
					end
				rescue => inner_exception
					Rails.logger.error("== -- Failed to process user: #{user.username}. Error: #{inner_exception.message}")
				end
			end	
		end
		

		def self.add_posts()
			# Fetch the category IDs
			watch_categories_ids = MagicMatching.post_watch_categories
		
			# Loop through each category ID
			watch_categories_ids.each do |category_id|
				category = Category.find_by_id(category_id)
		
				# Skip if category is not found
				next if category.nil?
		
				# Fetch topics from the category
				topics = Topic.where(category_id: category.id)
		
				# Loop through each topic in the category
				topics.each do |topic|
					# Fetch posts from the topic
					posts = Post.where(topic_id: topic.id)
											.where(post_type: Post.types[:regular])

					# Get tags for the topic
					tags = topic.tags.map(&:name)
	
					# Process each post in the topic
					posts.each do |post|
						begin
							new_post = api_client.create_post(post: post, args: {})
							if new_post
								Rails.logger.info("== -- Successfully processed post: #{post.subject}")
	# 							Rails.logger.info("== -- Embedding Results: #{new_post.dig('embedding_results')}")
							else 
								Rails.logger.error("== -- Failed to create post: #{post.subject}")
							end
	
		
							# Do something with each topic, post, and user. For example:
							# Store them in your database, or call an API
							Rails.logger.info("== -- Successfully processed topic: #{topic.title}, post: #{post.id}, created by user: #{user.username}")
						rescue => inner_exception
							Rails.logger.error("== -- Failed to process topic: #{topic.title}, post: #{post.id}. Error: #{inner_exception.message}")
						end
					end
				end
			end
		end



  end

end


