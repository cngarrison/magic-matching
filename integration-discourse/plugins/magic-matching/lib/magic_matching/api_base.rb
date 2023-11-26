# frozen_string_literal: true

require 'faraday'
require 'json'
require 'base64'

require_relative 'utils'

module ::MagicMatching
	class ApiBase
		def initialize(headers:, auth_user:)
			@api_url = SiteSetting.magicmatching_api_url
			@auth_user = auth_user
# 			auth_session = MagicMatching::Utils.get_plugindata('admin_auth_session')
# # 			headers['x-api-key'] = auth_session['access_token']   # admin user token, used with every request
# 			@api_token = auth_session['access_token'] if auth_session&.dig('access_token')
			@api_token = nil
			@headers = headers
			@http_client = Faraday.new(
				url: @api_url, 
				headers: @headers
			) do |f|
				# f.request :json # encode req bodies as JSON
				# f.request  :authorization, 'Bearer', @api_token if @api_token
				# f.response :json # decode response bodies as JSON
				f.response :logger # logs request and responses
				f.response :raise_error
				# f.adapter :net_http # Use the Net::HTTP adapter
				f.adapter  Faraday.default_adapter
			end
		end

		def get(path, params = {}, set_token = true)
			set_api_token if set_token
			process_request() do
				@http_client.get do |req|
					req.url path
					req.params = params
					req.headers['authorization'] = "Bearer #{@api_token}" if @api_token
				end
			end
		end
		
		def post(path, payload = {}, set_token = true)
			Rails.logger.error("Posting to: #{path}")
			set_api_token if set_token
			Rails.logger.info("post-payload: ")
			Rails.logger.info(payload.to_json)
			process_request() do
				@http_client.post do |req|
					req.url path
					req.headers['authorization'] = "Bearer #{@api_token}" if @api_token
					req.headers['Content-Type'] = 'application/json'
					req.body = payload.to_json
				end
			end
		end
		
		def put(path, payload = {}, set_token = true)
			set_api_token if set_token
			process_request() do
				@http_client.put do |req|
					req.url path
					req.headers['authorization'] = "Bearer #{@api_token}" if @api_token
					req.headers['Content-Type'] = 'application/json'
					req.body = payload.to_json
				end
			end
		end
		
		def delete(path, params = {}, set_token = true)
			set_api_token if set_token
			process_request() do
				@http_client.delete do |req|
					req.url path
					req.params = params
					req.headers['authorization'] = "Bearer #{@api_token}" if @api_token
				end
			end
		end


		private

		def process_request(retry_count: 0, &block)
			begin
				response = yield
				handle_response(response)
			rescue Faraday::ResourceNotFound => e
				Rails.logger.error("Resource not found: #{e.message}")
				JSON.parse(e.response[:body])
			rescue Faraday::ConflictError => e
				Rails.logger.error("Resource already exists: #{e.message}")
				JSON.parse(e.response[:body])
			rescue Faraday::TimeoutError
				Rails.logger.error("Request timed out")
				JSON.parse(e.response[:body])
			rescue Faraday::ConnectionFailed
				Rails.logger.error("Failed to connect to server")
				JSON.parse(e.response[:body])
			rescue Faraday::ClientError => e
				Rails.logger.error("Client error: #{e.message}")
				case e.response[:status]
				when 400
					Rails.logger.error("Bad Request: #{e.response[:body]}")
				when 401
					Rails.logger.error("Authorization failed: #{e.response[:body]}")
					if retry_count < 1
						refresh_api_token
						return process_request(retry_count: 1, &block)  # Retry the request with updated retry_count
					elsif retry_count < 2
						login_with_password
						return process_request(retry_count: 2, &block)  # Retry the request with updated retry_count
					end
				when 409
					Rails.logger.error("Resource exists: #{e.response[:body]}")
				when 429
					Rails.logger.warn("Rate limit exceeded")
				when 300..399
					Rails.logger.warn("Redirect encountered: #{e.response[:headers]['Location']}")
				end
				JSON.parse(e.response[:body])
			rescue Faraday::ServerError => e
				Rails.logger.error("Server error: #{e.message}")
				JSON.parse(e.response[:body])
			rescue StandardError => e
				Rails.logger.error("An unknown error occurred: #{e.message}")
				JSON.parse(e.response[:body]) if e.respond_to?(:response)
			end
		end


		def handle_response(response)
			JSON.parse(response.body)
		end

# 		def handle_response(response)
# 			case response.status
# 			when 200..299
# 				JSON.parse(response.body)
# 			when 400
# 				JSON.parse(response.body)
# # 				raise StandardError.new('Bad Request')
# 			when 401
# 				JSON.parse(response.body)
# # 				raise StandardError.new('Unauthorized')
# 			when 403
# 				raise StandardError.new('Forbidden')
# 			when 404
# 				raise StandardError.new('Not Found')
# 			when 500
# 				raise StandardError.new('Internal Server Error')
# 			else
# 				raise StandardError.new("HTTP Error: #{response.status}")
# 			end
# 		end

		def set_api_token
			# Try to get the API token from @auth_user
			Rails.logger.error("Setting api token")
			user_data = MagicMatching::Utils.get_userdata(@auth_user) if @auth_user
			@api_token = user_data&.dig('auth_session', 'access_token') if user_data
			# Rails.logger.error("Set API token from user data") if @api_token

			# If @api_token is still nil, try to get it from the plugin data
			@api_token ||= MagicMatching::Utils.get_plugindata('admin_auth_session')&.dig('access_token')
			# Rails.logger.error("Set API token") if @api_token

			# Log an error if the API token couldn't be set
			Rails.logger.error("Failed to set API token") unless @api_token
			## setup-plugin (& org-create) don't need api_token
			#raise StandardError.new("API Error: Failed to set API token") unless @api_token
		end
		
		def refresh_api_token
			# Initialize variables to hold refresh_token and its source ('user' or 'plugin')
			refresh_token = nil
			token_source = nil
		
			begin

				# Try to get refresh_token from @auth_user
				if @auth_user
					user_data = MagicMatching::Utils.get_userdata(@auth_user)
					if user_data
						access_token = user_data&.dig('auth_session', 'access_token')
						refresh_token = user_data&.dig('auth_session', 'refresh_token')
						token_source = 'user' if refresh_token
					end
				end
	
				# If refresh_token is still nil, try to get it from the plugin data
				unless refresh_token
					access_token = MagicMatching::Utils.get_plugindata('admin_auth_session')&.dig('access_token')
					refresh_token = MagicMatching::Utils.get_plugindata('admin_auth_session')&.dig('refresh_token')
					token_source = 'plugin' if refresh_token
				end
			
				# Log an error and return if refresh_token couldn't be found
				unless refresh_token
					Rails.logger.error("Failed to find refresh_token")
					return
				end
	
				@api_token = nil
				new_auth_session = post('/functions/v1/auth/refresh_token', { session: { access_token: access_token, refresh_token: refresh_token } }, false)
	
				# Save the new auth session depending on the original source of the refresh_token
				case token_source
				when 'user'
					user_data['auth_session'] = new_auth_session&.dig('session')
					MagicMatching::Utils.save_userdata(@auth_user, user_data)
				when 'plugin'
					plugin_data = new_auth_session&.dig('session')
					MagicMatching::Utils.save_plugindata('admin_auth_session', plugin_data)
				end
			
				# Set the new API token
				@api_token = new_auth_session&.dig('session','access_token')

			rescue => e
				Rails.logger.error("An unknown error occurred: #{e.message}")
			end
		end

		def login_with_password
			# Initialize variables to hold password and its source ('user' or 'plugin')
			password = nil
			password_source = nil
		
			begin

				# Try to get password from @auth_user
				if @auth_user
					user_data = MagicMatching::Utils.get_userdata(@auth_user)
					if user_data
						username = user_data&.dig('user', 'username')
						password = user_data&.dig('user', 'password')
						if password
							password_source = 'user'
						end
					end
				end
	
				# If password is still nil, try to get it from the plugin data
				unless password
					plugin_user_data = MagicMatching::Utils.get_plugindata('user')
					username = plugin_user_data&.dig('username')
					password = plugin_user_data&.dig('password')
					password_source = 'plugin' if password
				end
			
				# Log an error and return if password couldn't be found
				unless password
					Rails.logger.error("Failed to find password")
					return
				end
	
				decoded_password = Base64.strict_decode64(password)
				new_auth_session = post('/functions/v1/auth/login_with_password', { login: { username: username, password: decoded_password } }, false)
			
				# Save the new auth session depending on the original source of the password
				case password_source
				when 'user'
					user_data['auth_session'] = new_auth_session&.dig('session')
					MagicMatching::Utils.save_userdata(@auth_user, user_data)
				when 'plugin'
					plugin_data = new_auth_session&.dig('session')
					MagicMatching::Utils.save_plugindata('admin_auth_session', plugin_data)
				end
			
				# Set the new API token
				@api_token = new_auth_session&.dig('session','access_token')
				# Rails.logger.error("login_with_password-@api_token: #{@api_token}")

			rescue => e
				Rails.logger.error("An unknown error occurred: #{e.message}")
			end

		end

	end

end
