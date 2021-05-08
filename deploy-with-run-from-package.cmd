:: ----------------------
:: Custom Deployment Script
:: Fetches npm packages inside a temp folder (which is much faster), then zips it and mounts that zip file.
:: ----------------------

@IF "%WEBSITE_RUN_FROM_PACKAGE%" NEQ "1" (
    echo For this script to work you need to enable Run from Package, aka set WEBSITE_RUN_FROM_PACKAGE=1 
    exit /b 1
)

:: Copying sources to a temp folder
SET MY_BUILD_TEMP_FOLDER=%TMP%\D31DF8BFFAFC41C29F49640022B2C20D
mkdir %MY_BUILD_TEMP_FOLDER%
xcopy %DEPLOYMENT_SOURCE% %MY_BUILD_TEMP_FOLDER% /S /H /Y
IF %errorlevel% NEQ 0 goto end

cd %MY_BUILD_TEMP_FOLDER%

:: Installing npm packages
call npm install --production
IF %errorlevel% NEQ 0 goto end

:: Zipping the entire temp folder into d:\home\data\SitePackages\package.zip, 
:: which then will be automatically mounted as d:\home\site\wwwroot
mkdir d:\home\data\SitePackages
echo package.zip > d:\home\data\SitePackages\packagename.txt
del /Q d:\home\data\SitePackages\package.zip
powershell "$ProgressPreference = 'SilentlyContinue'; Compress-Archive %MY_BUILD_TEMP_FOLDER%\* d:\home\data\SitePackages\package.zip"

:end
:: Dropping the temp folder, so that no conflicts occur next time
rmdir /S /Q %MY_BUILD_TEMP_FOLDER%
exit /b %ERRORLEVEL%