# frozen_string_literal: true

module ::MagicMatching

  module Utils

		# Example usage:
		# user = User.find(id)
		# userdata = get_userdata(user)
		def self.get_userdata(user)
			raise Discourse::InvalidParameters.new(:user) if user.nil?
			begin
				# Attempt to fetch and parse the serialized user data
				serialized_userdata = user.custom_fields['magic_matching_userdata']
		
				# Check if the custom field is nil or empty
				if serialized_userdata.nil? || serialized_userdata.empty?
					#raise "User custom field 'magic_matching_userdata' is not set or empty."
					serialized_userdata = '{}'
				end
		
				# Attempt to parse the JSON data
				userdata = JSON.parse(serialized_userdata)
				# Rails.logger.debug("userdata type: #{userdata.class}, userdata value: #{userdata.inspect}")
				return userdata
			rescue JSON::ParserError => e
				# Handle JSON parsing errors
				Rails.logger.error("JSON parsing error reading user data for #{user&.dig('email')}: #{e.message}")
				return nil
			rescue StandardError => e
				# Handle other types of errors
				Rails.logger.error("An error occurred reading user data for #{user&.dig('email')}: #{e.message}")
				return nil
			end
		end

		# Example usage:
		# user = User.find(id)
		# data = get_userdata(user)
		# data[xtra] = "best bits" 
		# save_userdata(user, data)
		def self.save_userdata(user, userdata)
			raise Discourse::InvalidParameters.new(:user) if user.nil?
			raise Discourse::InvalidParameters.new(:userdata) if userdata.nil?
			begin
		    serialized_userdata = userdata.is_a?(Hash) || userdata.is_a?(Array) ? userdata.to_json : userdata
				# Rails.logger.info("Saving userdata for #{user.email}: #{serialized_userdata}")
				user.custom_fields['magic_matching_userdata'] = serialized_userdata
				user.save_custom_fields
				# Return true to indicate success
				return true
			rescue StandardError => e
				# Handle other types of errors
				Rails.logger.error("An error occurred saving user data for #{user&.dig('email')}: #{e.message}")
				# Return false to indicate failure
				return false
			end
		end


		# Example usage:
		# plugindata = get_plugindata(setting_name)
		def self.get_plugindata(setting_name)
			raise Discourse::InvalidParameters.new(:setting_name) if setting_name.nil?
			begin
				# Attempt to fetch the plugin data
				plugindata = PluginStore.get("magic_matching", setting_name)
		
				# Check if the setting is nil
				return nil if plugindata.nil?
				#plugindata = '{}' if plugindata.nil?
		
				# Check if the setting is an empty string
				return nil if plugindata.is_a?(String) && plugindata.empty?
		
				# Check if the data looks like JSON (starts with "{" or "[")
				if plugindata.is_a?(String) && (plugindata.start_with?('{') || plugindata.start_with?('['))
					# Attempt to parse the JSON data
					return JSON.parse(plugindata)
				else
					# Return simple values as-is
					return plugindata
				end

			rescue JSON::ParserError => e
				# Handle JSON parsing errors
				Rails.logger.error("JSON parsing error reading plugin data for #{setting_name}: #{e.message}")
				return nil
			rescue StandardError => e
				# Handle other types of errors
				Rails.logger.error("An error occurred reading plugin data for #{setting_name}: #{e.message}")
				return nil
			end
		end

		# Example usage:
		# data = get_plugindata(setting_name)
		# data[xtra] = "best bits" 
		# save_plugindata(setting_name, data)
		def self.save_plugindata(setting_name, plugindata)
			raise Discourse::InvalidParameters.new(:setting_name) if setting_name.nil?
			raise Discourse::InvalidParameters.new(:plugindata) if plugindata.nil?
			begin
		    serialized_plugindata = plugindata.is_a?(Hash) || plugindata.is_a?(Array) ? plugindata.to_json : plugindata
				# Rails.logger.info("Saving plugin data for #{setting_name}: #{serialized_plugindata}")
				PluginStore.set("magic_matching", setting_name, serialized_plugindata)
				# Return true to indicate success
				return true
			rescue StandardError => e
				# Handle other types of errors
				Rails.logger.error("An error occurred saving plugin data for #{setting_name}: #{e.message}")
				# Return false to indicate failure
				return false
			end
		end

  end

end


