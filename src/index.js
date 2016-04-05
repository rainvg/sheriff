var fs = require('fs');
var exec = require('child_process').exec;

var ps = {
  lookup: function(pid, callback)
  {
    if(/^win/.test(process.platform))
    {
      exec('tasklist /FI "PID eq ' + pid + '" /NH' , function(error, commands)
      {
        callback(error,commands.split(' ')[0]);
      });
    }
    else
    {
      exec('ps aux | grep ' + pid + ' | grep -v \'grep\' | awk \'{print $11}\'', function(error, command)
      {
        callback(error, command);
      });
    }
  }
};

function __command__(pid)
{
  'use strict';

  return new Promise(function(resolve, reject)
  {
    ps.lookup(pid, function(error, command)
    {
      if(error)
        reject(error);
      else
        resolve(command);
    });
  });
}

function __lockable__(path)
{
  'use strict';

  return new Promise(function(resolve)
  {
    fs.readFile(path, function(error, pid)
    {
      if(error)
        resolve(true);
      else
      {
        pid = pid.toString();
        __command__(process.pid.toString()).then(function(self)
        {
          __command__(pid).then(function(saved)
          {
            if(self === saved)
              resolve(false);
            else
              resolve(true);
          });
        });
      }
    });
  });
}

function lock(path)
{
  'use strict';

  return new Promise(function(resolve, reject)
  {
    __lockable__(path).then(function(lockable)
    {
      if(lockable)
      {
        fs.writeFile(path, process.pid.toString(), function(error)
        {
          if(error)
            reject();
          else
            resolve();
        });
      }
      else
        reject();
    });
  });
}

function unlock(path)
{
  return new Promise(function(resolve, reject)
  {
    fs.readFile(path, function(error, pid)
    {
      if(error || pid.toString() !== process.pid.toString())
        reject();
      else
        fs.writeFile(path, '', function(error)
        {
          if(error)
            reject();
          else
            resolve();
        });
    });
  });
}

module.exports = {
  lock: lock,
  unlock: unlock
};
