# Changelog [English] | [中文](changelog.md)

## 2025-02-13 JSON Configuration Format Optimization
1. Updated promptBlocks Storage Format
   - Changed promptBlocks from array format to object format
   - New format uses promptBlock1, promptBlock2, etc. as keys
   - Maintained backward compatibility with array format
   - Unified export to new format

2. Code Implementation Optimization
   - Updated configuration handling logic in useConfig.ts
   - Enhanced configuration validation mechanism for both formats
   - Improved configuration import/export functionality
   - Updated example configuration files to new format

3. Backward Compatibility Assurance
   - Maintained compatibility with existing configuration files
   - Automatic format conversion during import
   - Ensured all functionality works correctly
   - Enhanced error handling mechanisms

## 2025-02-12 i18n Infrastructure Completed
1. Completed Basic Infrastructure
   - Installed and configured vue-i18n
   - Created language file structure
   - Implemented language state management composable

2. Completed Language Text Management
   - Implemented complete type definitions
   - Created English and Chinese translation files
   - Implemented useLanguage composable
   - Completed component refactoring examples

3. Completed Data Loading Logic Refactoring
   - Implemented JSON file loading by language
   - Added data reloading on language switch
   - Completed file list auto-generation script

4. Pending Items
   - Unit tests
   - Integration tests
   - UI tests
   - Compatibility tests

## 2025-02-12 Added Best Practices for New Models
1. Added Bilingual Best Practices Documentation
   - Created Chinese version of best practices guide for adding new models
   - Created English version of best practices guide for adding new models
   - Added documentation links to README
   - Complete step-by-step instructions and example code

2. Documentation Key Points
   - API verification process explanation
   - Type definitions and configuration guide
   - Frontend integration steps
   - Testing and validation methods
   - Common issues and solutions

3. Real Case Study
   - Using Volces DeepseekV3 as an example
   - Complete implementation process demonstration
   - Key configuration explanations
   - Notes and best practices

## 2025-02-09 WebSocket Architecture Optimization
1. WebSocket Connection Management Optimization
   - Separated WebSocket connection management by business scenarios
   - Dedicated connection pool for speed test button: SpeedTestButtonWebSocket
   - Dedicated connection pool for execute button: ExecuteButtonWebSocket
   - Unified connection interface: getConnection(blockIndex, model)

2. Concurrency Control Optimization
   - Speed test functionality: SpeedTestButtonQueue (fixed concurrency of 4)
   - Execute functionality: ExecuteButtonQueue (default concurrency of 2)
   - Independent queue management and error handling
   - More reliable state synchronization mechanism

3. Message Processing Optimization
   - Unified message processing flow
   - Improved null value checking
   - Clearer error messages
   - More accurate state updates

4. Code Structure Optimization
   - Clearer file naming conventions
   - Completely separated business logic
   - Better code reuse
   - More maintainable architecture

## 2025-02-09 History Record Separation
1. History Storage Optimization
   - Implemented separation of chat and agent history records
   - Automatic loading of corresponding history through route meta configuration
   - Optimized history storage structure for multi-page independent storage
   - Improved history persistence solution

2. User Experience Improvements
   - Automatic history switching during page transitions
   - Optimized history deletion operation with automatic right panel cleanup
   - Maintained latest record first sorting logic
   - Added sync status and error notifications

3. Technical Implementation Optimization
   - Added route meta type definitions
   - Implemented route guards for page transitions
   - Optimized history component props passing
   - Improved related documentation

## 2025-02-09 WebSocket Path Unified Configuration
1. WebSocket Path Standardization
   - Unified frontend and backend WebSocket path to '/websocket'
   - Fixed path inconsistency between development and production environments
   - Updated nginx configuration for correct WebSocket request proxying
   - Ensured all WebSocket clients use the same connection configuration

2. Configuration Optimization
   - Unified WebSocket URL construction logic
   - Updated speed test feature WebSocket connection configuration
   - Optimized development environment WebSocket service configuration
   - Improved related documentation

## 2025-02-09 Speed Test Feature Optimization
1. Optimized Speed Test Implementation
   - Improved backend speed test mode session management
   - Used specific prefix for speed test sessions
   - Optimized concurrent request handling mechanism
   - Provided more stable testing experience

2. Implementation Detail Improvements
   - Unified speed test session ID format: `speed_test_${model}_${Date.now()}`
   - Utilized backend request queue for concurrency management
   - Optimized error handling mechanism
   - Added detailed speed test feature documentation

3. Documentation Updates
   - Added dedicated speed test feature documentation
   - Complete implementation architecture explanation
   - Detailed usage guide
   - Performance optimization suggestions
