import {downloadCache} from '../src/internal/cacheHttpClient'
import {getCacheVersion} from '../src/internal/cacheUtils'
import {CompressionMethod} from '../src/internal/constants'
import * as downloadUtils from '../src/internal/downloadUtils'
import {DownloadOptions, getDownloadOptions} from '../src/options'

jest.mock('../src/internal/downloadUtils')

test('getCacheVersion does not mutate arguments', async () => {
  const paths = ['node_modules']
  getCacheVersion(paths, undefined, true)
  expect(paths).toEqual(['node_modules'])
})

test('getCacheVersion with one path returns version', async () => {
  const paths = ['node_modules']
  const result = getCacheVersion(paths, undefined, true)
  expect(result).toEqual(
    'b3e0c6cb5ecf32614eeb2997d905b9c297046d7cbf69062698f25b14b4cb0985'
  )
})

test('getCacheVersion with multiple paths returns version', async () => {
  const paths = ['node_modules', 'dist']
  const result = getCacheVersion(paths, undefined, true)
  expect(result).toEqual(
    '165c3053bc646bf0d4fac17b1f5731caca6fe38e0e464715c0c3c6b6318bf436'
  )
})

test('getCacheVersion with zstd compression returns version', async () => {
  const paths = ['node_modules']
  const result = getCacheVersion(paths, CompressionMethod.Zstd, true)

  expect(result).toEqual(
    '273877e14fd65d270b87a198edbfa2db5a43de567c9a548d2a2505b408befe24'
  )
})

test('getCacheVersion with gzip compression returns version', async () => {
  const paths = ['node_modules']
  const result = getCacheVersion(paths, CompressionMethod.Gzip, true)

  expect(result).toEqual(
    '470e252814dbffc9524891b17cf4e5749b26c1b5026e63dd3f00972db2393117'
  )
})

test('getCacheVersion with enableCrossOsArchive as false returns version on windows', async () => {
  if (process.platform === 'win32') {
    const paths = ['node_modules']
    const result = getCacheVersion(paths)

    expect(result).toEqual(
      '2db19d6596dc34f51f0043120148827a264863f5c6ac857569c2af7119bad14e'
    )
  }
})

test('downloadCache uses http-client for non-Azure URLs', async () => {
  const downloadCacheHttpClientMock = jest.spyOn(
    downloadUtils,
    'downloadCacheHttpClient'
  )
  const downloadCacheStorageSDKMock = jest.spyOn(
    downloadUtils,
    'downloadCacheStorageSDK'
  )

  const archiveLocation = 'http://www.actionscache.test/download'
  const archivePath = '/foo/bar'

  await downloadCache(archiveLocation, archivePath)

  expect(downloadCacheHttpClientMock).toHaveBeenCalledTimes(1)
  expect(downloadCacheHttpClientMock).toHaveBeenCalledWith(
    archiveLocation,
    archivePath
  )

  expect(downloadCacheStorageSDKMock).toHaveBeenCalledTimes(0)
})

test('downloadCache uses storage SDK for Azure storage URLs', async () => {
  const downloadCacheHttpClientMock = jest.spyOn(
    downloadUtils,
    'downloadCacheHttpClient'
  )
  const downloadCacheStorageSDKMock = jest.spyOn(
    downloadUtils,
    'downloadCacheStorageSDK'
  )

  const downloadCacheHttpClientConcurrentMock = jest.spyOn(
    downloadUtils,
    'downloadCacheHttpClientConcurrent'
  )

  const archiveLocation = 'http://foo.blob.core.windows.net/bar/baz'
  const archivePath = '/foo/bar'

  await downloadCache(archiveLocation, archivePath)

  expect(downloadCacheHttpClientConcurrentMock).toHaveBeenCalledTimes(1)
  expect(downloadCacheHttpClientConcurrentMock).toHaveBeenCalledWith(
    archiveLocation,
    archivePath,
    getDownloadOptions()
  )

  expect(downloadCacheStorageSDKMock).toHaveBeenCalledTimes(0)
  expect(downloadCacheHttpClientMock).toHaveBeenCalledTimes(0)
})

test('downloadCache passes options to download methods', async () => {
  const downloadCacheHttpClientMock = jest.spyOn(
    downloadUtils,
    'downloadCacheHttpClient'
  )
  const downloadCacheStorageSDKMock = jest.spyOn(
    downloadUtils,
    'downloadCacheStorageSDK'
  )

  const downloadCacheHttpClientConcurrentMock = jest.spyOn(
    downloadUtils,
    'downloadCacheHttpClientConcurrent'
  )

  const archiveLocation = 'http://foo.blob.core.windows.net/bar/baz'
  const archivePath = '/foo/bar'
  const options: DownloadOptions = {downloadConcurrency: 4}

  await downloadCache(archiveLocation, archivePath, options)

  expect(downloadCacheHttpClientConcurrentMock).toHaveBeenCalledTimes(1)
  expect(downloadCacheHttpClientConcurrentMock).toHaveBeenCalled()
  expect(downloadCacheHttpClientConcurrentMock).toHaveBeenCalledWith(
    archiveLocation,
    archivePath,
    getDownloadOptions(options)
  )

  expect(downloadCacheStorageSDKMock).toHaveBeenCalledTimes(0)
  expect(downloadCacheHttpClientMock).toHaveBeenCalledTimes(0)
})

test('downloadCache uses http-client when overridden', async () => {
  const downloadCacheHttpClientMock = jest.spyOn(
    downloadUtils,
    'downloadCacheHttpClient'
  )
  const downloadCacheStorageSDKMock = jest.spyOn(
    downloadUtils,
    'downloadCacheStorageSDK'
  )

  const archiveLocation = 'http://foo.blob.core.windows.net/bar/baz'
  const archivePath = '/foo/bar'
  const options: DownloadOptions = {
    useAzureSdk: false,
    concurrentBlobDownloads: false
  }

  await downloadCache(archiveLocation, archivePath, options)

  expect(downloadCacheHttpClientMock).toHaveBeenCalledTimes(1)
  expect(downloadCacheHttpClientMock).toHaveBeenCalledWith(
    archiveLocation,
    archivePath
  )

  expect(downloadCacheStorageSDKMock).toHaveBeenCalledTimes(0)
})
